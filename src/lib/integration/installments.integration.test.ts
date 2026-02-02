import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Setup Supabase client para testes (URL e KEY vem do .env.test)
const supabase = createClient<Database>(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  process.env.TEST_SUPABASE_ANON_KEY || ''
);

describe('Installments Integration Tests', () => {
  let testHouseholdId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Criar household e usuário de teste
    const { data: household } = await supabase
      .from('households')
      .insert({ name: 'Test Household' })
      .select()
      .single();
    testHouseholdId = household!.id;

    const { data: { user } } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456',
    });
    testUserId = user!.id;

    await supabase.from('household_members').insert({
      household_id: testHouseholdId,
      user_id: testUserId,
      role: 'owner',
    });
  });

  afterAll(async () => {
    // Cleanup: deletar dados de teste
    await supabase.from('households').delete().eq('id', testHouseholdId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('should create installments via trigger when transaction has installments > 1', async () => {
    // Criar transação parcelada
    const { data: transaction } = await supabase
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

    // Verificar que parcelas foram criadas
    const { data: installments } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction!.id)
      .order('installment_number');

    expect(installments).toHaveLength(3);
    expect(installments![0].amount).toBe(100); // 300 / 3
    expect(installments![0].installment_number).toBe(1);
    expect(installments![2].installment_number).toBe(3);
  });

  it('should not create installments for single payment transaction', async () => {
    const { data: transaction } = await supabase
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

    const { data: installments } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction!.id);

    expect(installments).toHaveLength(0);
  });

  it('should respect RLS policies - user can only see own household installments', async () => {
    // Criar outro household
    const { data: otherHousehold } = await supabase
      .from('households')
      .insert({ name: 'Other Household' })
      .select()
      .single();

    const { data: otherTransaction } = await supabase
      .from('transactions')
      .insert({
        household_id: otherHousehold!.id,
        description: 'Other Transaction',
        amount: 200,
        type: 'expense',
        installments: 2,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    // Tentar buscar parcelas de outro household (deve falhar ou retornar vazio)
    const { data: installments } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', otherTransaction!.id);

    // Com RLS, não deve ter acesso
    expect(installments).toHaveLength(0);

    // Cleanup
    await supabase.from('households').delete().eq('id', otherHousehold!.id);
  });
});
