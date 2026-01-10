# 📋 CHANGELOG v1.5.0

**Data de Lançamento:** 10/01/2026  
**Base:** Finansix v1.4.0  
**Tipo:** Minor (Correções + Features)

---

## 🎯 RESUMO

Versão focada em **correções críticas** de bugs e **melhorias de UX**, incluindo novo feed de transações no dashboard analítico.

---

## 🐛 BUGS CORRIGIDOS

### 1. ✅ Somatório de Cartão com Parcelas Deletadas (CRÍTICO)

**Problema:**  
Ao deletar transações parceladas, o limite disponível do cartão não era recalculado corretamente.

**Causa:**  
View `credit_card_limits` não filtrava parcelas com `deleted_at IS NOT NULL`.

**Solução:**  
- Migration `20260110000002_fix_credit_card_limits_deleted_at.sql`
- Adicionado filtro `AND i.deleted_at IS NULL` em ambas subconsultas da view

**Impacto:**
- ✅ Limite disponível agora reflete apenas parcelas ativas
- ✅ Cálculo financeiro preciso
- ✅ Consistência de dados garantida

**Arquivo modificado:**
```sql
supabase/migrations/20260110000002_fix_credit_card_limits_deleted_at.sql
```

---

## ✨ NOVAS FEATURES

### 2. 🎨 Logo Melhorada nas Páginas de Autenticação

**Antes:**  
- Letra "F" simples em div quadrada
- Tamanho 16x16 (pequeno)
- Sem identidade visual forte

**Depois:**  
- Logo SVG com design "F$" estilizado
- Tamanho 24x24 (50% maior)
- Gradiente moderno em primary colors
- Animações sutis (pulse nos destaques)
- Consistente entre Login e Registro

**Arquivos modificados:**
```typescript
src/pages/auth/LoginPage.tsx
src/pages/auth/RegisterPage.tsx
```

**Preview:**
```tsx
<div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700">
  <svg viewBox="0 0 100 100" className="h-14 w-14 text-white">
    {/* F$ estilizado */}
  </svg>
</div>
```

---

### 3. 📊 Feed de Transações Recentes no Dashboard

**Feature:**  
Novo componente `RecentTransactionsFeed` exibindo últimas 10 transações na `AnalysisPage`.

**Funcionalidades:**
- ✅ Lista interativa das 10 transações mais recentes
- ✅ Ícones coloridos por categoria
- ✅ Badges para parcelas (ex: "12x")
- ✅ Status da transação visível
- ✅ Click para detalhes
- ✅ Botão "Ver todas" → redireciona para `/transactions`

**Componente criado:**
```typescript
src/components/features/RecentTransactionsFeed.tsx
```

**Integração:**
```tsx
// src/pages/AnalysisPage.tsx
<RecentTransactionsFeed limit={10} />
```

**UI/UX:**
- Design consistente com resto do app
- Skeleton loading states
- Empty state quando sem transações
- Hover effects
- Mobile-first responsive

---

### 4. 📑 Página Completa de Transações com Filtros

**Nova Rota:** `/transactions`

**Feature:**  
Página dedicada para visualização e filtragem de todas transações.

**Filtros Disponíveis:**
1. **Busca por texto** - Descrição ou categoria
2. **Tipo** - Todas / Receitas / Despesas
3. **Categoria** - Filtro multi-select com todas categorias
4. **Limpar filtros** - Reset rápido

**Funcionalidades:**
- ✅ Barra de busca com ícone
- ✅ Painel de filtros expansível (toggle)
- ✅ Badge de contagem de filtros ativos
- ✅ Resumo de totais (Receitas, Despesas, Saldo)
- ✅ Lista completa paginável
- ✅ FAB para nova transação
- ✅ Empty states contextuais

**Arquivos criados:**
```typescript
src/pages/AllTransactionsPage.tsx
```

**Rotas atualizadas:**
```typescript
src/App.tsx (adicionada rota /transactions)
```

**Estatísticas em tempo real:**
```tsx
<div className="grid grid-cols-3 gap-3">
  <Card>Receitas: R$ X</Card>
  <Card>Despesas: R$ Y</Card>
  <Card>Saldo: R$ Z</Card>
</div>
```

---

## 🔄 MELHORIAS

### UI/UX
- ✅ Logo 50% maior e mais profissional
- ✅ Animações sutis nos elementos decorativos
- ✅ Feedback visual melhorado em filtros
- ✅ Badges de contagem de filtros ativos
- ✅ Empty states informativos

### Performance
- ✅ Lazy loading da AllTransactionsPage
- ✅ Memoização de filtros em useMemo
- ✅ Queries otimizadas

### Acessibilidade
- ✅ ARIA labels nos botões de filtro
- ✅ Contraste melhorado em badges
- ✅ Focus states claros

---

## 📊 ESTATÍSTICAS

### Código

| Métrica | Valor |
|---------|-------|
| Arquivos Novos | 3 |
| Arquivos Modificados | 6 |
| Migrations Novas | 1 |
| Linhas Adicionadas | ~800 |
| Componentes Novos | 2 |

### Arquivos

**Novos:**
- `src/components/features/RecentTransactionsFeed.tsx` (165 linhas)
- `src/pages/AllTransactionsPage.tsx` (410 linhas)
- `supabase/migrations/20260110000002_fix_credit_card_limits_deleted_at.sql`

**Modificados:**
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/AnalysisPage.tsx`
- `src/components/features/index.ts`
- `src/App.tsx`

---

## 🚀 COMO ATUALIZAR

### 1. Aplicar Migration

```bash
# Conectar ao Supabase
supabase link --project-ref seu-projeto-id

# Aplicar migration
supabase migration up 20260110000002_fix_credit_card_limits_deleted_at

# Ou via SQL Editor no Supabase Dashboard
```

### 2. Atualizar Código

```bash
# Pull latest
git pull origin main

# Instalar dependências (se houver novas)
pnpm install

# Build
pnpm build
```

### 3. Deploy

```bash
# Vercel
vercel --prod

# Ou outro provider
```

---

## ⚠️ BREAKING CHANGES

**Nenhum!** Esta é uma atualização compatível com v1.4.0.

---

## 🐛 BUGS CONHECIDOS

Nenhum no momento.

---

## 📝 NOTAS ADICIONAIS

### Próximas Versões (Roadmap)

**v1.6.0 (Planejado):**
- Filtros por data na AllTransactionsPage
- Export de transações (CSV/PDF)
- Gráficos de categoria na AllTransactionsPage

**v2.0.0 (Futuro):**
- Design system completo
- Atomic transactions via RPC
- Testing coverage 80%+

---

## 🙏 AGRADECIMENTOS

Equipe Versix Team Developers pela implementação das correções.

---

**Versão:** 1.5.0  
**Data:** 10/01/2026  
**Status:** ✅ Production Ready
