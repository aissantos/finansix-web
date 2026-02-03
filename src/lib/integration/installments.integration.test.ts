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

// Skip integration tests in CI - they require local Supabase instance
const shouldSkipIntegrationTests = !process.env.TEST_SUPABASE_URL || process.env.CI === 'true';
const describeOrSkip = shouldSkipIntegrationTests ? describe.skip : describe;

describeOrSkip('Installments Integration Tests', () => {
  let testHouseholdId: string;

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
  });

  afterAll(async () => {
    // Cleanup: deletar dados de teste
    await supabase.from('households').delete().eq('id', testHouseholdId);
  });

  it('should create and fetch a household', async () => {
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', testHouseholdId)
      .single();

    expect(household).toBeDefined();
    expect(household?.name).toBe('Test Household');
  });

  it('should create installments via trigger when transaction has installments > 1', async () => {
    // This test requires migrations to be applied to local Supabase
    // Column 'installments' and trigger need to exist in the database schema

    // Create a transaction with 3 installments
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        description: 'Compra Parcelada 3x',
        amount: -300,
        type: 'expense',
        installments: 3,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    expect(txError).toBeNull();
    expect(transaction).toBeDefined();

    // Check if installments were created by the trigger
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction!.id)
      .order('installment_number');

    expect(instError).toBeNull();
    expect(installments).toHaveLength(3);

    // Verify installment amounts are correct (300 / 3 = 100 each)
    expect(installments![0].amount).toBe(100);
    expect(installments![0].installment_number).toBe(1);
    expect(installments![2].installment_number).toBe(3);
  });

  it('should not create installments for single payment transaction', async () => {
    // Create a transaction without installments (single payment)
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: testHouseholdId,
        description: 'Compra à Vista',
        amount: -100,
        type: 'expense',
        installments: 1, // Single payment
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    expect(txError).toBeNull();
    expect(transaction).toBeDefined();

    // Verify NO installments were created
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transaction!.id);

    expect(instError).toBeNull();
    expect(installments).toHaveLength(0);
  });

  // Note: RLS tests are skipped when using service role key
  // Service role bypasses all RLS policies by design
  // To test RLS properly, we would need to create a separate test suite using anon key
  it.skip('should respect RLS policies - user can only see own household installments', async () => {
    // This test would require:
    // 1. Using TEST_SUPABASE_ANON_KEY instead of SERVICE_KEY
    // 2. Authenticating as a specific user
    // 3. Creating test data in different households
    // 4. Verifying cross-household access is blocked
    //
    // Skipped for now as service role key bypasses all RLS
  });
});
