
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTransfers() {
  console.log('Starting Aggressive Transfer Fix...');

  // 1. Fix Outgoing (Expense -> Transfer, make negative)
  // We look for ANY 'expense' with 'Transferência' description
  const { data: outgoing, error: outError } = await supabase
    .from('transactions')
    .select('id, amount, description')
    .eq('type', 'expense')
    .ilike('description', '%Transferência%');

  if (outError) {
    console.error('Error fetching outgoing candidates:', outError);
  } else {
    console.log(`Found ${outgoing?.length} outgoing transfers to fix.`);
    
    for (const tx of outgoing || []) {
      // Ensure it's negative
      const newAmount = -Math.abs(tx.amount);
      const newAmountCents = -Math.abs(Math.round(tx.amount * 100));

      const { error } = await supabase
        .from('transactions')
        .update({
          type: 'transfer',
          amount: newAmount,
          amount_cents: newAmountCents
        })
        .eq('id', tx.id);

      if (error) console.error(`Failed to update outgoing tx ${tx.id}:`, error);
      else console.log(`Fixed outgoing tx ${tx.id} (${tx.description}) -> Transfer ${newAmount}`);
    }
  }

  // 2. Fix Incoming (Income -> Transfer, ensure positive)
  const { data: incoming, error: inError } = await supabase
    .from('transactions')
    .select('id, amount, description')
    .eq('type', 'income')
    .ilike('description', '%Transferência%');

  if (inError) {
    console.error('Error fetching incoming candidates:', inError);
  } else {
    console.log(`Found ${incoming?.length} incoming transfers to fix.`);

    for (const tx of incoming || []) {
      const newAmount = Math.abs(tx.amount);
      const newAmountCents = Math.abs(Math.round(tx.amount * 100));

      const { error } = await supabase
        .from('transactions')
        .update({
          type: 'transfer',
          amount: newAmount,
          amount_cents: newAmountCents
        })
        .eq('id', tx.id);

      if (error) console.error(`Failed to update incoming tx ${tx.id}:`, error);
      else console.log(`Fixed incoming tx ${tx.id} (${tx.description}) -> Transfer ${newAmount}`);
    }
  }
}

fixTransfers();
