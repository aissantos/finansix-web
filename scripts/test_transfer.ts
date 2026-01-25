import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpivdezffjeyzukfzhcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaXZkZXpmZmpleXp1a2Z6aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0NzQwMSwiZXhwIjoyMDgzMTIzNDAxfQ.LNGjyVjFAHdifVMppL7ZZbeVO859bzozi9bAxE2pBps';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testTransferFlow() {
  console.log('=== TESTE DE TRANSFERÊNCIA ===\n');

  try {
    // 1. Buscar contas Swille e Bradesco
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, current_balance, household_id')
      .in('name', ['Swille', 'Bradesco'])
      .is('deleted_at', null);

    if (accountsError) throw accountsError;
    if (!accounts || accounts.length < 2) {
      console.error('❌ Contas não encontradas!');
      return;
    }

    const swille = accounts.find(a => a.name === 'Swille');
    const bradesco = accounts.find(a => a.name === 'Bradesco');

    if (!swille || !bradesco) {
      console.error('❌ Contas Swille ou Bradesco não encontradas!');
      return;
    }

    console.log('📊 SALDOS ANTES DA TRANSFERÊNCIA:');
    console.log(`   Swille:   R$ ${swille.current_balance.toFixed(2)}`);
    console.log(`   Bradesco: R$ ${bradesco.current_balance.toFixed(2)}\n`);

    const transferAmount = 2258.90;
    const description = `Transferência: Swille → Bradesco`;

    // 2. Criar transação de SAÍDA (Swille)
    console.log('💸 Criando transação de SAÍDA (Swille)...');
    const { data: outgoingTx, error: outgoingError } = await supabase
      .from('transactions')
      .insert({
        household_id: swille.household_id,
        account_id: swille.id,
        type: 'transfer',
        amount: -transferAmount, // NEGATIVO para saída
        description: description,
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })
      .select()
      .single();

    if (outgoingError) {
      console.error('❌ Erro ao criar transação de saída:', outgoingError);
      throw outgoingError;
    }

    console.log(`   ✅ Transação criada: ID ${outgoingTx.id}`);
    console.log(`   Amount: ${outgoingTx.amount}`);
    console.log(`   Amount Cents: ${outgoingTx.amount_cents}\n`);

    // 3. Criar transação de ENTRADA (Bradesco)
    console.log('💰 Criando transação de ENTRADA (Bradesco)...');
    const { data: incomingTx, error: incomingError } = await supabase
      .from('transactions')
      .insert({
        household_id: bradesco.household_id,
        account_id: bradesco.id,
        type: 'transfer',
        amount: transferAmount, // POSITIVO para entrada
        description: description,
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })
      .select()
      .single();

    if (incomingError) {
      console.error('❌ Erro ao criar transação de entrada:', incomingError);
      throw incomingError;
    }

    console.log(`   ✅ Transação criada: ID ${incomingTx.id}`);
    console.log(`   Amount: ${incomingTx.amount}`);
    console.log(`   Amount Cents: ${incomingTx.amount_cents}\n`);

    // 4. Aguardar triggers processarem (pequeno delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verificar saldos atualizados
    const { data: updatedAccounts, error: updatedError } = await supabase
      .from('accounts')
      .select('id, name, current_balance, current_balance_cents')
      .in('id', [swille.id, bradesco.id]);

    if (updatedError) throw updatedError;

    const updatedSwille = updatedAccounts?.find(a => a.id === swille.id);
    const updatedBradesco = updatedAccounts?.find(a => a.id === bradesco.id);

    console.log('📊 SALDOS DEPOIS DA TRANSFERÊNCIA:');
    console.log(`   Swille:   R$ ${updatedSwille?.current_balance.toFixed(2)} (cents: ${updatedSwille?.current_balance_cents})`);
    console.log(`   Bradesco: R$ ${updatedBradesco?.current_balance.toFixed(2)} (cents: ${updatedBradesco?.current_balance_cents})\n`);

    // 6. Verificar resultados
    console.log('✅ VERIFICAÇÃO DOS RESULTADOS:\n');

    const swilleExpected = swille.current_balance - transferAmount;
    const bradescoExpected = bradesco.current_balance + transferAmount;

    const swilleCorrect = Math.abs((updatedSwille?.current_balance || 0) - swilleExpected) < 0.01;
    const bradescoCorrect = Math.abs((updatedBradesco?.current_balance || 0) - bradescoExpected) < 0.01;

    console.log(`   Swille esperado:   R$ ${swilleExpected.toFixed(2)}`);
    console.log(`   Swille atual:      R$ ${updatedSwille?.current_balance.toFixed(2)}`);
    console.log(`   Status: ${swilleCorrect ? '✅ CORRETO' : '❌ INCORRETO'}\n`);

    console.log(`   Bradesco esperado: R$ ${bradescoExpected.toFixed(2)}`);
    console.log(`   Bradesco atual:    R$ ${updatedBradesco?.current_balance.toFixed(2)}`);
    console.log(`   Status: ${bradescoCorrect ? '✅ CORRETO' : '❌ INCORRETO'}\n`);

    if (swilleCorrect && bradescoCorrect) {
      console.log('🎉 TESTE PASSOU! Transferências funcionando corretamente!');
    } else {
      console.log('❌ TESTE FALHOU! Há problemas com o cálculo de saldo.');
    }

    // 7. Buscar transações para verificar exibição
    console.log('\n📝 TRANSAÇÕES CRIADAS:\n');
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .in('id', [outgoingTx.id, incomingTx.id]);

    transactions?.forEach(tx => {
      const accountName = tx.account_id === swille.id ? 'Swille' : 'Bradesco';
      const sign = tx.amount < 0 ? '-' : '+';
      const color = tx.amount < 0 ? '🔴' : '🟢';
      console.log(`   ${color} ${accountName}: ${sign}R$ ${Math.abs(tx.amount).toFixed(2)}`);
      console.log(`      Type: ${tx.type}, Amount Cents: ${tx.amount_cents}`);
    });

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
  }
}

testTransferFlow();
