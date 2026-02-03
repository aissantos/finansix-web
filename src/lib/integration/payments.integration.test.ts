import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { calculateFreeBalance } from '@/lib/utils/calculations';

// Default anon key is the standard Supabase local development key
const TEST_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  TEST_ANON_KEY
);

describe('Payment Summary Integration Tests', () => {
  let testHouseholdId: string;

  beforeAll(async () => {
    const { data: household } = await supabase
      .from('households')
      .insert({ name: 'Payment Test Household' })
      .select()
      .single();
    testHouseholdId = household!.id;
  });

  afterAll(async () => {
    await supabase.from('households').delete().eq('id', testHouseholdId);
  });

  it('should calculate correct free balance with pending expenses', async () => {
    // Criar conta com saldo
    const { data: account } = await supabase
      .from('accounts')
      .insert({
        household_id: testHouseholdId,
        name: 'Test Account',
        current_balance: 1000,
        is_active: true,
      })
      .select()
      .single();

    // Criar despesa pendente
    await supabase.from('transactions').insert({
      household_id: testHouseholdId,
      account_id: account!.id,
      description: 'Pending Expense',
      amount: -200,
      type: 'expense',
      status: 'pending',
      transaction_date: new Date().toISOString(),
    });

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
    await supabase.from('accounts').insert([
      { household_id: householdId, name: 'Account 1', current_balance: 500, is_active: true },
      { household_id: householdId, name: 'Account 2', current_balance: 300, is_active: true },
    ]);

    const result = await calculateFreeBalance(householdId, new Date(), false);

    // Saldo total = 500 + 300 = 800
    expect(result.currentBalance).toBe(800);
  });
});
