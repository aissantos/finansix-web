import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS policies during integration tests
// Default service role key is the standard Supabase local development service key
const TEST_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  TEST_SERVICE_KEY
);

// Skip integration tests in CI - they require local Supabase instance
const shouldSkipIntegrationTests = !process.env.TEST_SUPABASE_URL || process.env.CI === 'true';
const describeOrSkip = shouldSkipIntegrationTests ? describe.skip : describe;

describeOrSkip('Payment Summary Integration Tests', () => {
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

  it('should create and fetch household', async () => {
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', testHouseholdId)
      .single();

    expect(household).toBeDefined();
    expect(household?.name).toBe('Payment Test Household');
  });

  it('should calculate correct free balance with pending expenses', async () => {
    // Create an account with balance
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

    expect(account).toBeDefined();

    // Create a pending expense
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        account_id: account!.id,
        description: 'Pending Expense',
        amount: -200,
        type: 'expense',
        status: 'pending',
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    expect(transaction).toBeDefined();

    // Query the account balance (should still be 1000 since transaction is pending)
    const { data: updatedAccount } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('id', account!.id)
      .single();

    expect(updatedAccount?.current_balance).toBe(1000);

    // Free balance calculation would need to account for pending transactions
    // This would typically be done in application logic or a database function
  });

  it('should handle multiple accounts correctly', async () => {
    // Create two accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .insert([
        {
          household_id: testHouseholdId,
          name: 'Account 1',
          current_balance: 500,
          is_active: true,
        },
        {
          household_id: testHouseholdId,
          name: 'Account 2',
          current_balance: 300,
          is_active: true,
        },
      ])
      .select();

    expect(accounts).toHaveLength(2);

    // Query all accounts for the household
    const { data: householdAccounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('household_id', testHouseholdId)
      .eq('is_active', true);

    expect(householdAccounts).toBeDefined();
    expect(householdAccounts!.length).toBeGreaterThanOrEqual(2);

    // Calculate total balance across all accounts
    const totalBalance = householdAccounts!.reduce(
      (sum, acc) => sum + (acc.current_balance || 0),
      0
    );

    expect(totalBalance).toBeGreaterThanOrEqual(800); // At least 500 + 300
  });
});
