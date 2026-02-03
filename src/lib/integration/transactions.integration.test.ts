import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Default anon key is the standard Supabase local development key
const TEST_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient<Database>(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  TEST_ANON_KEY
);

describe('Transactions Integration Tests', () => {
  let testHouseholdId: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Criar household de teste
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: 'Transactions Test Household' })
      .select()
      .single();

    if (householdError || !household) {
      throw new Error(`Failed to create household: ${householdError?.message || 'Unknown error'}`);
    }
    testHouseholdId = household.id;

    // Criar conta de teste
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        household_id: testHouseholdId,
        name: 'Test Account',
        type: 'checking',
        current_balance: 1000,
        is_active: true,
      })
      .select()
      .single();

    if (accountError || !account) {
      throw new Error(`Failed to create account: ${accountError?.message || 'Unknown error'}`);
    }
    testAccountId = account.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('households').delete().eq('id', testHouseholdId);
  });

  it('should create a transaction with correct data', async () => {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        account_id: testAccountId,
        description: 'Test Transaction',
        amount: -100,
        type: 'expense',
        status: 'completed',
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(transaction).toBeDefined();
    expect(transaction!.description).toBe('Test Transaction');
    expect(transaction!.amount).toBe(-100);
    expect(transaction!.type).toBe('expense');
  });

  it('should soft delete transaction (set deleted_at)', async () => {
    // Criar transação
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        account_id: testAccountId,
        description: 'To Be Deleted',
        amount: -50,
        type: 'expense',
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !transaction) {
      throw new Error(`Failed to create transaction: ${txError?.message || 'Unknown error'}`);
    }

    // Soft delete (update deleted_at)
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transaction.id);

    expect(error).toBeNull();

    // Verificar que transação não aparece mais em queries normais
    const { data: found } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction.id)
      .is('deleted_at', null);

    expect(found).toHaveLength(0);
  });

  it('should enforce RLS - cannot access other household transactions', async () => {
    // Criar outro household
    const { data: otherHousehold, error: hhError } = await supabase
      .from('households')
      .insert({ name: 'Other Household' })
      .select()
      .single();

    if (hhError || !otherHousehold) {
      throw new Error(`Failed to create other household: ${hhError?.message || 'Unknown error'}`);
    }

    // Criar conta em outro household
    const { data: otherAccount, error: accError } = await supabase
      .from('accounts')
      .insert({
        household_id: otherHousehold.id,
        name: 'Other Account',
        type: 'checking',
        current_balance: 500,
        is_active: true,
      })
      .select()
      .single();

    if (accError || !otherAccount) {
      throw new Error(`Failed to create other account: ${accError?.message || 'Unknown error'}`);
    }

    // Criar transação em outro household
    const { data: otherTransaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: otherHousehold.id,
        account_id: otherAccount.id,
        description: 'Other Household Transaction',
        amount: -200,
        type: 'expense',
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !otherTransaction) {
      throw new Error(`Failed to create other transaction: ${txError?.message || 'Unknown error'}`);
    }

    // Tentar buscar transação de outro household (deve retornar vazio com RLS)
    const { data: found } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', otherTransaction.id);

    // Com RLS, não deve ter acesso
    expect(found).toHaveLength(0);

    // Cleanup
    await supabase.from('households').delete().eq('id', otherHousehold.id);
  });
});
