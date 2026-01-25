import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function manuallyRecalculateBalances() {
  console.log('=== RECALCULANDO SALDOS MANUALMENTE ===\n');

  try {
    // Buscar contas Swille e Bradesco
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .in('name', ['Swille', 'Bradesco'])
      .is('deleted_at', null);

    if (!accounts) {
      console.error('❌ Contas não encontradas!');
      return;
    }

    for (const account of accounts) {
      console.log(`\n🔄 Recalculando saldo de: ${account.name}`);
      
      // Chamar a função update_account_balance diretamente
      const { data, error } = await supabase.rpc('update_account_balance', {
        p_account_id: account.id
      });

      if (error) {
        console.error(`   ❌ Erro ao recalcular: ${error.message}`);
      } else {
        console.log(`   ✅ Saldo recalculado com sucesso!`);
      }
    }

    // Verificar saldos atualizados
    console.log('\n📊 SALDOS ATUALIZADOS:\n');
    const { data: updatedAccounts } = await supabase
      .from('accounts')
      .select('name, current_balance, current_balance_cents')
      .in('name', ['Swille', 'Bradesco']);

    updatedAccounts?.forEach(acc => {
      console.log(`   ${acc.name}: R$ ${acc.current_balance.toFixed(2)} (cents: ${acc.current_balance_cents})`);
    });

  } catch (error) {
    console.error('\n❌ ERRO:', error);
  }
}

manuallyRecalculateBalances();
