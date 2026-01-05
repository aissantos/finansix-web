import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InsertTables } from '@/types';
import { Client as PgClient } from 'pg';

declare global {
  var __integ: {
    pg: PgClient;
    householdId: string;
    cardId: string;
  };
}

const LOCAL_SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON = process.env.TEST_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDc0MDEsImV4cCI6MjA4MzEyMzQwMX0.AME1Yqp4QjONriAVZYelzcAmi78r_PZfVJtAiqALheM';

// Connection to local Postgres as superuser for setup/cleanup
const PG_CONN = process.env.TEST_PG_CONN ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Only run these integration tests when an explicit TEST_SUPABASE_URL is provided (e.g., locally or in special CI job)
const RUN_INTEG = Boolean(process.env.TEST_SUPABASE_URL);
const describeInteg = RUN_INTEG ? describe : describe.skip;

describeInteg('Integration: installments trigger + RLS', () => {
  let pg: PgClient;
  let supabase: SupabaseClient;
  let userClient: SupabaseClient;
  let testUserEmail: string;
  let testUserPassword: string;
  let userId: string;

  beforeAll(async () => {
    pg = new PgClient({ connectionString: PG_CONN });
    await pg.connect();

    supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON);

    // create a test user and sign in
    testUserEmail = `integ-${Date.now()}@example.com`;
    testUserPassword = 'Password123!';

    const { data: _signUpData, error: signUpError } = await supabase.auth.signUp({ email: testUserEmail, password: testUserPassword });
    if (signUpError) throw signUpError;

    // sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: testUserEmail, password: testUserPassword });
    if (signInError) throw signInError;

    userClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${signInData.session?.access_token}` } },
    });

    if (!signInData.user?.id) {
      throw new Error('User ID not found after sign in');
    }
    userId = signInData.user.id;

    // create household, credit_card using superuser so we don't rely on extra policies
    const resHouse = await pg.query(`INSERT INTO households (name) VALUES ($1) RETURNING id`, ['integ-house-' + Date.now()]);
    const householdId = resHouse.rows[0].id;

    await pg.query(`INSERT INTO household_members (household_id, user_id, role, display_name) VALUES ($1, $2, $3, $4)`, [householdId, userId, 'owner', 'integ']);

    const resCard = await pg.query(`INSERT INTO credit_cards (household_id, name, credit_limit, closing_day, due_day, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id`, [householdId, 'Test Card', 1000, 15, 5]);
    const cardId = resCard.rows[0].id;

    // store on supabase client for tests via pg inserted data
    global.__integ = { pg, householdId, cardId };
  });

  afterAll(async () => {
    try {
      const s = global.__integ;
      if (s?.householdId) {
        await pg.query(`DELETE FROM installments WHERE household_id = $1`, [s.householdId]);
        await pg.query(`DELETE FROM transactions WHERE household_id = $1`, [s.householdId]);
        await pg.query(`DELETE FROM credit_cards WHERE household_id = $1`, [s.householdId]);
        await pg.query(`DELETE FROM household_members WHERE household_id = $1`, [s.householdId]);
        await pg.query(`DELETE FROM households WHERE id = $1`, [s.householdId]);
      }

      // remove test user
      if (userId) {
        await pg.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);
      }
    } finally {
      await pg.end();
    }
  });

  it('should create installments when inserting an installment transaction as the user', async () => {
    const { pg: p, householdId, cardId } = global.__integ;

    // Insert transaction as the authenticated user via userClient
    const txPayload = {
      household_id: householdId,
      credit_card_id: cardId,
      amount: 300,
      total_installments: 3,
      is_installment: true,
      transaction_date: new Date().toISOString().slice(0, 10),
      description: 'integ-test-installment',
      type: 'expense',
    } as InsertTables<'transactions'>;

    const { data: txData, error: txError } = await userClient.from('transactions').insert(txPayload).select().single();
    expect(txError).toBeNull();
    expect(txData).toBeDefined();

    const txId = txData.id;

    // Poll for installments to appear (trigger runs after insert)
    const maxMs = 5000;
    const intervalMs = 200;
    let elapsed = 0;
    let instRows: Array<{ id: string; installment_number: number; amount: number }> = [];
    while (elapsed < maxMs) {
      const res = await p.query(`SELECT id, installment_number, amount FROM installments WHERE transaction_id = $1 ORDER BY installment_number`, [txId]);
      instRows = res.rows;
      if (instRows.length === txPayload.total_installments) break;
      await new Promise((r) => setTimeout(r, intervalMs));
      elapsed += intervalMs;
    }

    expect(instRows.length).toBe(txPayload.total_installments);
    for (let i = 0; i < instRows.length; i++) {
      expect(instRows[i].installment_number).toBe(i + 1);
      expect(Number(instRows[i].amount)).toBeCloseTo(100.0, 2);
    }

    // Also verify RLS: query transactions as another signed-up user should not see this transaction
    const secondEmail = `integ2-${Date.now()}@example.com`;
    const secondPass = 'Password123!';
    await supabase.auth.signUp({ email: secondEmail, password: secondPass });
    const { data: secondSignIn } = await supabase.auth.signInWithPassword({ email: secondEmail, password: secondPass });
    const otherClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON, { global: { headers: { Authorization: `Bearer ${secondSignIn.session?.access_token}` } } });

    const { data: otherTxs } = await otherClient.from('transactions').select('*').eq('id', txId);
    expect(otherTxs).toEqual([]);

    // cleanup created transaction (superuser)
    await p.query(`DELETE FROM installments WHERE transaction_id = $1`, [txId]);
    await p.query(`DELETE FROM transactions WHERE id = $1`, [txId]);
  }, 20000);
});
