# 🔧 RELEASE NOTES - FINANSIX v1.5.4.6

**Data:** 10 de Janeiro de 2026  
**Tipo:** Hotfix + New Feature  
**Base:** v1.5.2.x  
**Status:** ✅ PRODUCTION READY

---

## 📊 RESUMO EXECUTIVO

Esta release corrige um bug crítico na exibição de parcelas retroativas, adiciona o novo sistema de pagamento de contas e faturas, e inclui cards de resumo de pagamentos nas páginas Home e Analysis.

### Problemas Corrigidos

🐛 **Hotfix**: Parcelas de compras retroativas apareciam todas no mês atual
🐛 **Migration Fix**: Erro de ENUM type corrigido

### Novas Funcionalidades

✅ **Bill Payment System** - Pagamento/baixa de contas a pagar  
✅ **Invoice Payment** - Pagamento de fatura de cartão (Total, Parcial, Mínimo)  
✅ **Payment Summary Cards** - Cards de resumo na Home e Analysis  
✅ **Overdue Tracking** - Identificação automática de contas vencidas
✅ **Removed Saldo Total** - Removido da página Wallet

---

## 🐛 HOTFIX - Parcelas Retroativas

### Problema Reportado

> "Quando adiciono despesa retroativa (data anterior à data corrente), parcelada em cartão, notei que as parcelas anteriores aparecem todas no mês corrente. Por exemplo: se adiciono uma compra de 300,00 realizada em 22/08/2025, 05 parcelas de 25,00 aparecem no mês de janeiro."

### Causa Raiz

O filtro de parcelas na `CardDetailPage` usava `due_date <= closingDate`, pegando **todas** as parcelas pendentes do passado até a data de fechamento atual.

### Solução Implementada

Alterado para filtrar por `billing_month` em vez de `due_date`:

```javascript
// DEPOIS (correto)
const currentBillInstallments = cardInstallments.filter(i => {
  const billingMonth = new Date(i.billing_month);
  const currentBillingMonth = startOfMonth(closingDate);
  return billingMonth.getTime() === currentBillingMonth.getTime() && i.status === 'pending';
});
```

---

## 🐛 HOTFIX - Migration ENUM Error

### Problema

```
ERROR: invalid input value for enum installment_status: "partial" (SQLSTATE 22P02)
```

### Causa

A coluna `status` em `installments` usa um ENUM type (`installment_status`), não TEXT com CHECK constraint.

### Solução

Migration atualizada para detectar se é ENUM e usar `ALTER TYPE ... ADD VALUE`:

```sql
IF v_data_type = 'USER-DEFINED' THEN
  ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'overdue';
  ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'partial';
  ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'cancelled';
END IF;
```

---

## ✨ NOVA FUNCIONALIDADE - Payment Summary Cards

### Componente PaymentSummaryCards

Exibe 4 cards com resumo de pagamentos:

| Card | Descrição | Cor |
|------|-----------|-----|
| **A Pagar** | Contas e parcelas pendentes | 🟡 Amarelo |
| **Pago** | Pagamentos do mês | 🟢 Verde |
| **Vencido** | Contas/parcelas vencidas | 🔴 Vermelho |
| **Saldo Parcial** | Saldo restante de pagamentos parciais | 🔵 Azul |

### Integração

- **HomePage**: Cards exibidos logo após o BalanceHero
- **AnalysisPage**: Seção "Status de Pagamentos" antes do Comparativo Mensal

---

## 📁 ARQUIVOS ALTERADOS/CRIADOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/wallet/CardDetailPage.tsx` | Modificado | Fix filtro parcelas |
| `src/pages/HomePage.tsx` | Modificado | +PaymentSummaryCards |
| `src/pages/AnalysisPage.tsx` | Modificado | +PaymentSummaryCards |
| `src/pages/WalletPage.tsx` | Modificado | -ConsolidatedBalance |
| `src/components/features/PaymentDialog.tsx` | **NOVO** | Dialog de pagamento |
| `src/components/features/PaymentSummaryCards.tsx` | **NOVO** | Cards de resumo |
| `src/components/features/index.ts` | Modificado | +exports |
| `src/hooks/usePaymentSummary.ts` | **NOVO** | Hook para resumo |
| `src/hooks/index.ts` | Modificado | +export |
| `supabase/migrations/20260110200000_bill_payment_status.sql` | **NOVO** | Schema (FIXED) |
| `README.md` | Modificado | v1.5.4.6 |

---

## 🗄️ MIGRATION SQL (CORRIGIDA)

A migration agora:
1. Detecta se `status` é ENUM ou TEXT
2. Usa `ALTER TYPE ... ADD VALUE` para ENUMs
3. Adiciona colunas `paid_at` e `paid_amount`
4. Cria tabela `credit_card_statements`
5. Cria funções RPC: `pay_bill`, `pay_credit_card_invoice`, `get_payment_summary`

---

## 📦 INSTALAÇÃO

```bash
# 1. Extrair
tar -xzf finansix-v1.5.4.6-bill-payments.tar.gz
cd finansix-web

# 2. Instalar dependências
pnpm install

# 3. IMPORTANTE: Aplicar migration
pnpm supabase db push

# 4. Desenvolvimento
pnpm dev
```

⚠️ **A migration foi corrigida e deve funcionar agora!**

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Hotfix Parcelas
- [x] Compra retroativa mostra apenas parcela do mês atual
- [x] Parcelas passadas em seção separada "Vencidas"

### Payment Summary Cards
- [x] Cards aparecem na HomePage
- [x] Cards aparecem na AnalysisPage
- [x] Valores corretos (A Pagar, Pago, Vencido, Parcial)
- [x] Card de vencido destacado se > 0

### WalletPage
- [x] Saldo Total removido
- [x] Tabs funcionando normalmente

### Migration
- [x] Executa sem erros de ENUM
- [x] Colunas adicionadas corretamente
- [x] Funções RPC criadas

---

**FINANSIX v1.5.4.6**  
**Versix Team Developers**  
10 de Janeiro de 2026

🐛 **HOTFIX PARCELAS RETROATIVAS**  
🐛 **HOTFIX MIGRATION ENUM**  
✅ **PAYMENT SUMMARY CARDS**  
✅ **SISTEMA DE PAGAMENTO DE CONTAS**  
➖ **REMOVIDO SALDO TOTAL DA WALLET**

🚀 **PRONTO PARA PRODUÇÃO**
