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

  it('should create and fetch household', async () => {
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', testHouseholdId)
      .single();

    expect(household).toBeDefined();
    expect(household?.name).toBe('Payment Test Household');
  });

  // Skipped: requires custom schema and migrations
  it.skip('should calculate correct free balance with pending expenses', async () => {
    // This test requires the full database schema with all custom columns
    // Run locally with: supabase db reset && pnpm test src/lib/integration/
  });

  // Skipped: requires custom schema and migrations
  it.skip('should handle multiple accounts correctly', async () => {
    // This test requires the full database schema with all custom columns
  });
});
