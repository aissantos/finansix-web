
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugBalance() {
  console.log('--- Debugging Account Balances ---');

  // get accounts
  const { data: accounts } = await supabase.from('accounts').select('id, name, current_balance, initial_balance');
  
  if (!accounts) return;

  for (const acc of accounts) {
    console.log(`\nAccount: ${acc.name} (${acc.id})`);
    console.log(`Current Balance (DB): ${acc.current_balance}`);
    console.log(`Initial Balance: ${acc.initial_balance}`);

    // Sum transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, amount_cents, status')
      .eq('account_id', acc.id)
      .is('deleted_at', null)
      .eq('status', 'completed');

    let calcBalance = acc.initial_balance;
    let income = 0;
    let expense = 0;
    let transfer = 0;

    txs?.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
      else if (tx.type === 'transfer') transfer += tx.amount;
    });

    console.log(`Transactions: Income=${income}, Expense=${expense}, Transfer=${transfer}`);
    const final = (acc.initial_balance || 0) + income - expense + transfer;
    console.log(`Calculated Balance: ${final}`);
    console.log(`Match? ${Math.abs(final - acc.current_balance) < 0.01 ? 'YES' : 'NO'}`);
  }
}

debugBalance();
