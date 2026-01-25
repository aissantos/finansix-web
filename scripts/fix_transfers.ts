
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTransfers() {
  console.log('Starting transfer fix...');

  // 1. Fix Outgoing (Expense -> Transfer, amount should be negative)
  // Find candidates: type=expense AND description starts with 'Transferência' AND amount > 0
  const { data: outgoing, error: outError } = await supabase
    .from('transactions')
    .select('id, amount, description')
    .eq('type', 'expense')
    .gt('amount', 0)
    .ilike('description', 'Transferência:%');

  if (outError) {
    console.error('Error fetching outgoing candidates:', outError);
  } else {
    console.log(`Found ${outgoing?.length} outgoing transfers to fix.`);
    
    for (const tx of outgoing || []) {
      const newAmount = -Math.round(Math.abs(tx.amount * 100)) / 100; // Force negative
      const newAmountCents = -Math.round(Math.abs(tx.amount * 100));

      const { error } = await supabase
        .from('transactions')
        .update({
          type: 'transfer',
          amount: newAmount,
          amount_cents: newAmountCents
        })
        .eq('id', tx.id);

      if (error) console.error(`Failed to update outgoing tx ${tx.id}:`, error);
      else console.log(`Fixed outgoing tx ${tx.id} (${tx.description})`);
    }
  }

  // 2. Fix Incoming (Income -> Transfer, amount should be positive)
  // Find candidates: type=income AND description starts with 'Transferência'
  // (Amount is already positive, just change type)
  const { data: incoming, error: inError } = await supabase
    .from('transactions')
    .select('id, description')
    .eq('type', 'income')
    .ilike('description', 'Transferência:%');

  if (inError) {
    console.error('Error fetching incoming candidates:', inError);
  } else {
    console.log(`Found ${incoming?.length} incoming transfers to fix.`);

    for (const tx of incoming || []) {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: 'transfer'
        })
        .eq('id', tx.id);

      if (error) console.error(`Failed to update incoming tx ${tx.id}:`, error);
      else console.log(`Fixed incoming tx ${tx.id} (${tx.description})`);
    }
  }
}

fixTransfers();
