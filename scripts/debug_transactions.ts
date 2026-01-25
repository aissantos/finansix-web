
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugTransactions() {
  console.log('Fetching recent transactions...');

  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, amount_cents, description, status, transaction_date')
    .ilike('description', '%Transferência%')
    .order('transaction_date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

debugTransactions();
