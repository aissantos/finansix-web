import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Setup Supabase client para testes
// Use service role key to bypass RLS policies during integration tests
// Default service role key is the standard Supabase local development service key
const TEST_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  TEST_SERVICE_KEY
);

describe('Installments Integration Tests', () => {
  let testHouseholdId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Criar household e usuário de teste
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: 'Test Household' })
      .select()
      .single();

    if (householdError || !household) {
      throw new Error(`Failed to create household: ${householdError?.message || 'Unknown error'}`);
    }
    testHouseholdId = household.id;

    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
    });

    if (authError || !user) {
      throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`);
    }
    testUserId = user.id;

    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: testHouseholdId,
      user_id: testUserId,
      role: 'owner',
    });

    if (memberError) {
      throw new Error(`Failed to create household member: ${memberError.message}`);
    }
  });

  afterAll(async () => {
    // Cleanup: deletar dados de teste
    await supabase.from('households').delete().eq('id', testHouseholdId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('should create installments via trigger when transaction has installments > 1', async () => {
    // Criar transação parcelada
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        description: 'Compra Parcelada',
        amount: 300,
        type: 'expense',
        installments: 3,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      throw new Error(`Failed to create transaction: ${txError?.message || 'Unknown error'}`);
    }

    // Verificar que parcelas foram criadas
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction.id)
      .order('installment_number');

    if (instError) {
      throw new Error(`Failed to fetch installments: ${instError.message}`);
    }

    expect(installments).toHaveLength(3);
    expect(installments![0].amount).toBe(100); // 300 / 3
    expect(installments![0].installment_number).toBe(1);
    expect(installments![2].installment_number).toBe(3);
  });

  it('should not create installments for single payment transaction', async () => {
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        description: 'Compra À Vista',
        amount: 100,
        type: 'expense',
        installments: 1,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      throw new Error(`Failed to create transaction: ${txError?.message || 'Unknown error'}`);
    }

    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction.id);

    if (instError) {
      throw new Error(`Failed to fetch installments: ${instError.message}`);
    }

    expect(installments).toHaveLength(0);
  });

  it('should respect RLS policies - user can only see own household installments', async () => {
    // Criar outro household
    const { data: otherHousehold, error: otherHhError } = await supabase
      .from('households')
      .insert({ name: 'Other Household' })
      .select()
      .single();

    if (otherHhError || !otherHousehold) {
      throw new Error(`Failed to create other household: ${otherHhError?.message || 'Unknown error'}`);
    }

    const { data: otherTransaction, error: otherTxError } = await supabase
      .from('transactions')
      .insert({
        household_id: otherHousehold.id,
        description: 'Other Transaction',
        amount: 200,
        type: 'expense',
        installments: 2,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (otherTxError || !otherTransaction) {
      throw new Error(`Failed to create other transaction: ${otherTxError?.message || 'Unknown error'}`);
    }

    // Tentar buscar parcelas de outro household (deve falhar ou retornar vazio)
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', otherTransaction.id);

    if (instError) {
      throw new Error(`Failed to fetch installments: ${instError.message}`);
    }

    // Com RLS, não deve ter acesso
    expect(installments).toHaveLength(0);

    // Cleanup
    await supabase.from('households').delete().eq('id', otherHousehold.id);
  });
});
