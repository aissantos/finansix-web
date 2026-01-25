import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugBalanceCalculation() {
  console.log('=== DEBUG: CÁLCULO DE SALDO ===\n');

  try {
    // Buscar conta Swille
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, initial_balance, current_balance')
      .eq('name', 'Swille')
      .single();

    if (!accounts) {
      console.error('❌ Conta Swille não encontrada!');
      return;
    }

    console.log(`📊 Conta: ${accounts.name}`);
    console.log(`   ID: ${accounts.id}`);
    console.log(`   Saldo Inicial: R$ ${accounts.initial_balance.toFixed(2)}`);
    console.log(`   Saldo Atual: R$ ${accounts.current_balance.toFixed(2)}\n`);

    // Buscar TODAS as transações da conta
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('id, type, amount, amount_cents, status, description, deleted_at')
      .eq('account_id', accounts.id)
      .order('created_at', { ascending: false });

    console.log(`📝 Total de transações: ${allTransactions?.length || 0}\n`);

    // Agrupar por tipo
    const byType = {
      income: allTransactions?.filter(t => t.type === 'income' && t.status === 'completed' && !t.deleted_at) || [],
      expense: allTransactions?.filter(t => t.type === 'expense' && t.status === 'completed' && !t.deleted_at) || [],
      transfer: allTransactions?.filter(t => t.type === 'transfer' && t.status === 'completed' && !t.deleted_at) || []
    };

    console.log(`💰 INCOME (${byType.income.length}):`);
    byType.income.forEach(t => {
      console.log(`   ${t.description}: R$ ${t.amount} (cents: ${t.amount_cents})`);
    });

    console.log(`\n💸 EXPENSE (${byType.expense.length}):`);
    byType.expense.forEach(t => {
      console.log(`   ${t.description}: R$ ${t.amount} (cents: ${t.amount_cents})`);
    });

    console.log(`\n🔄 TRANSFER (${byType.transfer.length}):`);
    byType.transfer.forEach(t => {
      console.log(`   ${t.description}: R$ ${t.amount} (cents: ${t.amount_cents})`);
    });

    // Calcular saldo manualmente
    const initialCents = Math.round(accounts.initial_balance * 100);
    const incomeCents = byType.income.reduce((sum, t) => sum + (t.amount_cents || 0), 0);
    const expenseCents = byType.expense.reduce((sum, t) => sum + (t.amount_cents || 0), 0);
    const transferCents = byType.transfer.reduce((sum, t) => sum + (t.amount_cents || 0), 0);

    const calculatedBalanceCents = initialCents + incomeCents - expenseCents + transferCents;
    const calculatedBalance = calculatedBalanceCents / 100;

    console.log(`\n🧮 CÁLCULO MANUAL:`);
    console.log(`   Inicial:    ${initialCents} cents (R$ ${accounts.initial_balance.toFixed(2)})`);
    console.log(`   + Income:   ${incomeCents} cents`);
    console.log(`   - Expense:  ${expenseCents} cents`);
    console.log(`   + Transfer: ${transferCents} cents`);
    console.log(`   = Total:    ${calculatedBalanceCents} cents (R$ ${calculatedBalance.toFixed(2)})`);

    console.log(`\n✅ COMPARAÇÃO:`);
    console.log(`   Saldo Calculado: R$ ${calculatedBalance.toFixed(2)}`);
    console.log(`   Saldo no Banco:  R$ ${accounts.current_balance.toFixed(2)}`);
    console.log(`   Match: ${Math.abs(calculatedBalance - accounts.current_balance) < 0.01 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('\n❌ ERRO:', error);
  }
}

debugBalanceCalculation();
