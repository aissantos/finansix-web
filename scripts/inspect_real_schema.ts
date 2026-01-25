
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectRealSchema() {
  console.log('--- Inspecting Real DB Schema ---');

  // 1. Check Column Type
  const { data: columns, error: colError } = await supabase
    .rpc('exec_sql', { sql: `
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'type';
    ` });
  
  // Note: exec_sql might not exist or be accessible. 
  // If not, we try to infer from an insert error.
  
  if (colError || !columns) {
      console.log('RPC exec_sql not available. Trying Insert to probe...');
      await probeInsert();
  } else {
      console.log('Columns:', columns);
  }
}

async function probeInsert() {
    // Try to insert a valid 'transfer' to see the exact error
    // We get a random account first
    const { data: accounts } = await supabase.from('accounts').select('id, household_id').limit(1);
    if (!accounts || !accounts.length) { 
        console.log('No accounts.'); 
        return; 
    }
    const acc = accounts[0];

    console.log('Attempting insert with type=transfer...');
    const { error } = await supabase.from('transactions').insert({
        household_id: acc.household_id,
        account_id: acc.id,
        type: 'transfer',
        amount: -10, // Try negative first
        description: 'Probe Transfer',
        transaction_date: new Date().toISOString()
    });

    if (error) {
        console.log('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS! (So the API should work?)');
    }
}

inspectRealSchema();
