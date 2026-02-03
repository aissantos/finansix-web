import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { calculateFreeBalance } from '@/lib/utils/calculations';

// Use service role key to bypass RLS policies during integration tests
// Default service role key is the standard Supabase local development service key
const TEST_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  TEST_SERVICE_KEY
);

describe('Payment Summary Integration Tests', () => {
  let testHouseholdId: string;

  beforeAll(async () => {
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: 'Payment Test Household' })
      .select()
      .single();

    if (householdError || !household) {
      throw new Error(`Failed to create household: ${householdError?.message || 'Unknown error'}`);
    }
    testHouseholdId = household.id;
  });

  afterAll(async () => {
    await supabase.from('households').delete().eq('id', testHouseholdId);
  });

  it('should calculate correct free balance with pending expenses', async () => {
    // Criar conta com saldo
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

    // Criar despesa pendente
    const { error: txError } = await supabase.from('transactions').insert({
      household_id: testHouseholdId,
      account_id: account.id,
      description: 'Pending Expense',
      amount: -200,
      type: 'expense',
      status: 'pending',
      transaction_date: new Date().toISOString(),
    });

    if (txError) {
      throw new Error(`Failed to create transaction: ${txError.message}`);
    }

    // Calcular free balance
    const result = await calculateFreeBalance(
      testHouseholdId,
      new Date(),
      false // sem projeções
    );

    // Saldo livre = 1000 - 200 = 800
    expect(result.freeBalance).toBe(800);
    expect(result.currentBalance).toBe(1000);
    expect(result.pendingExpenses).toBe(200);
  });

  it('should handle multiple accounts correctly', async () => {
    const householdId = testHouseholdId;

    // Criar 2 contas
    const { error: accountsError } = await supabase.from('accounts').insert([
      { household_id: householdId, name: 'Account 1', type: 'checking', current_balance: 500, is_active: true },
      { household_id: householdId, name: 'Account 2', type: 'savings', current_balance: 300, is_active: true },
    ]);

    if (accountsError) {
      throw new Error(`Failed to create accounts: ${accountsError.message}`);
    }

    const result = await calculateFreeBalance(householdId, new Date(), false);

    // Saldo total = 500 + 300 = 800
    expect(result.currentBalance).toBe(800);
  });
});
