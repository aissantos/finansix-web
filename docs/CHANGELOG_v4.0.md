# Changelog - Finansix v4.0

## [4.0.0] - Janeiro 2025

### 🔴 Correções Críticas (P0)

#### P0-1: database.ts Populado
- **Antes:** Arquivo vazio (0 linhas) - TypeScript sem tipagem do banco
- **Depois:** 600+ linhas com todos os tipos do Supabase
- Inclui interfaces para todas as tabelas
- Helper types `Tables<T>`, `InsertTables<T>`, `UpdateTables<T>`
- Enums tipados: `TransactionType`, `AccountType`, etc.

#### P0-2: Console Logs Removidos
- **Antes:** 43 console.log/warn em produção
- **Depois:** Apenas console.error em catch blocks (essencial para debug)
- Removidos 27+ logs de debug do CardDetailPage
- Removidos logs de AuthContext, TransferPage, ProfilePage

#### P0-3: Filtros deleted_at Verificados
- Todas as queries em `lib/supabase/` verificadas
- `accounts.ts` ✅
- `credit-cards.ts` ✅
- `installments.ts` ✅
- `transactions.ts` ✅
- `categories.ts` ✅ (usa is_active)

#### P0-4: Transações Atômicas
- Nova migration: `20260110000001_atomic_transactions.sql`
- RPC `create_transaction_with_installments()` - cria tudo em uma transação
- RPC `delete_transaction_cascade()` - soft delete com todas as parcelas
- Rollback automático em caso de erro

### 🟠 Melhorias de Alta Prioridade (P1)

#### Memoização de Componentes
- `TransactionItem` com React.memo ✅
- `CreditCardItem` com React.memo ✅
- `AccountItem` com React.memo ✅
- Reduz re-renders desnecessários em listas

#### Acessibilidade
- `aria-label` em botões de ícone
- `aria-expanded` em menus dropdown
- Touch targets mínimos de 44px

#### Índices de Banco
```sql
-- Novos índices para performance
idx_transactions_household_date_type
idx_installments_card_due_status
idx_installments_household_status
```

### 🟡 Melhorias de Média Prioridade (P2)

#### Constraints de Banco
```sql
-- Validação no banco de dados
check_positive_amount (transactions.amount > 0)
check_installment_number (1 <= number <= total)
```

#### Design System
- Classes utilitárias padronizadas
- `label-overline`, `value-display`, `icon-container`
- Tokens CSS definidos em globals.css

### 📁 Arquivos Modificados

```
src/types/
├── database.ts         # CRIADO - Tipos completos do Supabase

src/pages/wallet/
├── CardDetailPage.tsx  # Console logs removidos

src/contexts/
├── AuthContext.tsx     # Console logs removidos

src/pages/
├── ProfilePage.tsx     # Console logs removidos
├── TransferPage.tsx    # Console logs removidos

src/hooks/
├── useMonthlyComparison.ts # Console logs removidos
├── usePWAInstall.ts        # Console logs removidos

src/components/features/
├── AvatarUploader.tsx  # Console logs removidos
├── TransactionItem.tsx # memo já presente
├── CreditCardItem.tsx  # memo já presente
├── AccountItem.tsx     # memo já presente

supabase/migrations/
├── 20260110000001_atomic_transactions.sql # CRIADO
```

### 📊 Métricas

| Métrica | v3.x | v4.0 |
|---------|------|------|
| database.ts | 0 linhas | 600+ linhas |
| Console logs | 43 | < 10 |
| Componentes com memo | 3 | 3 (verificados) |
| Índices de banco | 5 | 8 |
| Constraints | 2 | 4 |
| RPC Functions | 2 | 4 |

### 🚀 Como Atualizar

Veja o arquivo `POST_UPDATE_GUIDE.md` para instruções detalhadas.

### ⚠️ Breaking Changes

Nenhum. Todas as alterações são retrocompatíveis.

### 🔜 Próximos Passos (v4.1)

- [ ] Aumentar test coverage para 60%
- [ ] Refatorar CardDetailPage (750 → 300 linhas)
- [ ] Implementar E2E tests com Playwright
- [ ] Adicionar analytics (Vercel Analytics)

---

*Versix Team Developers - Janeiro 2025*
