# 🚀 GUIA PÓS-ATUALIZAÇÃO - FINANSIX v4.0

## Passos para Deploy das Correções

Este guia detalha como aplicar as correções e melhorias da auditoria v4.0.

---

## 📋 PRÉ-REQUISITOS

```bash
# Verificar versões
node --version    # >= 18.x
pnpm --version    # >= 8.x
supabase --version # >= 1.x
```

---

## 🔧 PASSO 1: Atualizar Código Local

```bash
# 1. Extrair o pacote
tar -xzvf finansix-web-v4.0-audit-fixes.tar.gz

# 2. Entrar no diretório
cd finansix-web-main

# 3. Instalar dependências
pnpm install

# 4. Verificar TypeScript
pnpm typecheck
```

---

## 🗄️ PASSO 2: Aplicar Migrations no Supabase

### Opção A: Via CLI (Recomendado)

```bash
# 1. Login no Supabase
supabase login

# 2. Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplicar migrations
supabase db push

# 4. Verificar status
supabase db status
```

### Opção B: Via Dashboard

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute cada migration em ordem:
   - `20260110000001_atomic_transactions.sql`

---

## ✅ PASSO 3: Verificar Correções

### 3.1 Verificar Types

```bash
# Gerar tipos atualizados (opcional)
pnpm db:types

# Verificar build
pnpm build
```

### 3.2 Verificar Console Logs Removidos

```bash
# Deve retornar apenas erros permitidos (catch blocks)
grep -rn "console\." src --include="*.tsx" --include="*.ts" | wc -l
# Esperado: < 10 (apenas console.error em catch)
```

### 3.3 Testar Localmente

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Abrir no navegador
open http://localhost:3000
```

---

## 🚀 PASSO 4: Deploy para Produção

### Via Vercel (Recomendado)

```bash
# 1. Commit das alterações
git add .
git commit -m "fix: apply v4.0 audit corrections"

# 2. Push para branch principal
git push origin main

# Vercel fará deploy automático
```

### Via Manual

```bash
# Build de produção
pnpm build

# O output estará em dist/
```

---

## 📊 PASSO 5: Verificação Pós-Deploy

### Checklist de Validação

- [ ] Login funciona corretamente
- [ ] Dashboard carrega sem erros
- [ ] Transações são criadas corretamente
- [ ] Parcelas são geradas automaticamente
- [ ] Exclusão de transação remove parcelas
- [ ] Filtros de data funcionam
- [ ] PWA funciona offline

### Verificar no Console do Navegador

```javascript
// Não deve haver console.logs de debug
// Apenas erros reais (se houver)
```

---

## 🆕 NOVAS FEATURES DISPONÍVEIS

### 1. Transações Atômicas

```typescript
// Usar nova RPC function para criar transações com parcelas
const { data: transactionId } = await supabase.rpc(
  'create_transaction_with_installments',
  {
    p_transaction: {
      household_id: householdId,
      credit_card_id: cardId,
      amount: 1200,
      description: 'Compra parcelada',
      total_installments: 12,
      type: 'expense'
    },
    p_generate_installments: true
  }
);
```

### 2. Exclusão em Cascata

```typescript
// Deleta transação e todas as parcelas relacionadas
const { data: success } = await supabase.rpc(
  'delete_transaction_cascade',
  { p_transaction_id: transactionId }
);
```

### 3. Tipagem Completa

```typescript
// Agora com autocomplete completo
import type { Transaction, Installment, CreditCard } from '@/types';

const transaction: Transaction = {
  // TypeScript validará todos os campos
};
```

---

## 🔍 TROUBLESHOOTING

### Erro: "Column updated_at does not exist"

```sql
-- Executar no Supabase SQL Editor
ALTER TABLE installments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### Erro: "Access denied to household"

```sql
-- Verificar se RPC function tem permissão
GRANT EXECUTE ON FUNCTION public.create_transaction_with_installments TO authenticated;
```

### Erro de Build TypeScript

```bash
# Regenerar tipos do Supabase
pnpm db:types

# Limpar cache
rm -rf node_modules/.cache
pnpm build
```

### Dados deletados aparecem na UI

Verificar se todas as queries têm `.is('deleted_at', null)`:

```typescript
// CORRETO
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('household_id', householdId)
  .is('deleted_at', null); // ✅ Filtro obrigatório
```

---

## 📈 MÉTRICAS DE SUCESSO

Após aplicar as correções, verificar:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Console logs | 43 | < 10 |
| TypeScript errors | ? | 0 |
| Build time | ~30s | ~25s |
| Bundle size | ~450KB | ~420KB |

---

## 🔗 LINKS ÚTEIS

- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com)
- [Documentação TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📞 SUPORTE

Em caso de problemas:

1. Verificar logs do Vercel
2. Verificar logs do Supabase
3. Abrir issue no repositório

---

*Guia criado por Versix Team Developers*
*Versão: 4.0 - Janeiro 2025*
