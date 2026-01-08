# 🎨 Análise de Consistência UI/UX - Finansix

## Data: Janeiro 2025
## Versão: 2.0.0

---

# PARTE 1: ANÁLISE DE TOKENS DE DESIGN

---

## 1. Border Radius (Inconsistências)

### Dados Coletados
| Classe | Ocorrências | Pixels | Uso |
|--------|-------------|--------|-----|
| `rounded-full` | 68 | 9999px | Botões circulares, badges, avatares |
| `rounded-xl` | 68 | 12px | Inputs, ícones, botões internos |
| `rounded-2xl` | 45 | 16px | Cards, containers |
| `rounded-lg` | 25 | 8px | Botões menores, toggles |
| `rounded-3xl` | 13 | 24px | Cards grandes, items de lista |
| `rounded-md` | 3 | 6px | Elementos pequenos |

### 🚨 PROBLEMA: Sem padrão definido

**Card Component definido:**
```tsx
// card.tsx usa rounded-2xl (16px)
className="rounded-2xl border..."
```

**Mas no código real:**
```tsx
// WalletPage.tsx - Cards usando rounded-3xl!
className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm..."

// CreditCardItem.tsx - Card usando rounded-3xl!
className="rounded-3xl p-6 shadow-lg..."

// TransactionItem.tsx - Card usando rounded-2xl
className="rounded-2xl border..."
```

### ✅ RECOMENDAÇÃO

| Elemento | Border Radius | Classe |
|----------|---------------|--------|
| Cards grandes (lista) | 16px | `rounded-2xl` |
| Cards pequenos | 12px | `rounded-xl` |
| Inputs | 12px | `rounded-xl` |
| Botões | 12px | `rounded-xl` |
| Badges/Pills | 9999px | `rounded-full` |
| Ícones containers | 12px | `rounded-xl` |
| Avatares | 9999px | `rounded-full` |

---

## 2. Tipografia (Inconsistências Graves)

### Tamanhos de Fonte

| Classe | Ocorrências | Uso Real |
|--------|-------------|----------|
| `text-[10px]` | 70 | Labels, sublabels, datas |
| `text-[9px]` | 2 | Detalhes mínimos |
| `text-xs` (12px) | 74 | Textos secundários |
| `text-sm` (14px) | 78 | Textos principais |
| `text-base` (16px) | 11 | Títulos médios |
| `text-lg` (18px) | 21 | Títulos de seção |
| `text-xl` (20px) | 10 | Valores financeiros |
| `text-2xl` (24px) | 13 | Valores grandes |
| `text-3xl` (30px) | 5 | Hero numbers |
| `text-4xl` (36px) | 5 | Saldo principal |

### 🚨 PROBLEMA: `text-[10px]` usado 70x!

**Deveria ser um token:**
```tsx
// ❌ ERRADO - 70 ocorrências de hardcoded
className="text-[10px] font-bold text-slate-400 uppercase tracking-wide"

// ✅ CORRETO - Criar classe utilitária
className="label-overline" // text-[10px] font-bold uppercase tracking-wide
```

### Pesos de Fonte

| Classe | Ocorrências |
|--------|-------------|
| `font-bold` | 164 |
| `font-medium` | 31 |
| `font-black` | 22 |
| `font-extrabold` | 6 |
| `font-semibold` | 3 |

### 🚨 PROBLEMA: 5 pesos diferentes!

Para mobile, recomenda-se no máximo 3:
- `font-medium` (500) - Texto normal
- `font-bold` (700) - Títulos e labels
- `font-black` (900) - Valores em destaque

**O `font-extrabold` e `font-semibold` deveriam ser removidos.**

---

## 3. Cores (Análise)

### Cores Semânticas Definidas (tailwind.config)
```js
colors: {
  primary: '#135BEC',
  'primary-dark': '#0F4ABE',
  income: '#22c55e',
  expense: '#ef4444',
}
```

### 🚨 PROBLEMA: Cores hardcoded

```tsx
// ❌ Cores hardcoded em vários arquivos
style={{ backgroundColor: '#820AD1' }} // Nubank
style={{ backgroundColor: '#FF7A00' }} // Inter
backgroundColor: '#ec0000' // Santander

// ✅ Deveria usar variáveis ou presets centralizados
```

### Cinzas/Slate

O app usa corretamente a paleta `slate-*`:
- `slate-50` - Background claro
- `slate-100` - Bordas claras
- `slate-200` - Bordas/separadores
- `slate-400` - Texto terciário
- `slate-500` - Texto secundário
- `slate-600` - Texto/ícones
- `slate-700` - Dark mode borders
- `slate-800` - Dark mode backgrounds
- `slate-900` - Dark mode base

✅ **Isto está consistente.**

---

## 4. Espaçamento (Gaps e Paddings)

### Gaps
| Classe | Ocorrências |
|--------|-------------|
| `gap-2` (8px) | 61 |
| `gap-3` (12px) | 40 |
| `gap-4` (16px) | 18 |
| `gap-1` (4px) | 19 |

### Paddings
| Classe | Ocorrências |
|--------|-------------|
| `p-3` | 67 |
| `p-2` | 65 |
| `p-4` | 52 |
| `p-5` | 15 |
| `p-6` | 14 |

### 🚨 PROBLEMA: Muita variação

**Cards com padding inconsistente:**
```tsx
// NewCardPage - Card usa p-4
<Card className="p-4">

// CreditCardItem - usa p-6
className="rounded-3xl p-6 shadow-lg..."

// ProfilePage - SettingItem usa p-4
className="p-4 hover:bg-slate-50..."

// SubscriptionItem - usa p-4
className="p-4"
```

### ✅ RECOMENDAÇÃO

| Contexto | Padding |
|----------|---------|
| Cards de conteúdo | `p-4` (16px) |
| Cards de lista (items) | `p-4` (16px) |
| Cards hero/destaque | `p-5` ou `p-6` |
| Modais/Forms | `p-4` |
| Seções | `py-6` |

---

## 5. Tamanhos de Ícones

### Análise
| Classe | Ocorrências | Uso |
|--------|-------------|-----|
| `h-4 w-4` | 88 | Ícones inline, botões |
| `h-5 w-5` | 53 | Ícones de navegação |
| `h-3 w-3` | 31 | Ícones muito pequenos |
| `h-10 w-10` | 21 | Avatar small, botões circulares |
| `h-8 w-8` | 20 | Ícones em cards |
| `h-12 w-12` | 18 | Avatar medium, ícones de categoria |
| `h-6 w-6` | 13 | BottomNav |

### ✅ RECOMENDAÇÃO

| Contexto | Tamanho | Classe |
|----------|---------|--------|
| Inline em texto | 16px | `h-4 w-4` |
| Navegação/Header | 20px | `h-5 w-5` |
| Card icon containers | 24px | `h-6 w-6` |
| Avatares pequenos | 40px | `h-10 w-10` |
| Avatares médios | 48px | `h-12 w-12` |
| Icon containers em cards | 40-48px | `h-10` ou `h-12` |

---

# PARTE 2: INCONSISTÊNCIAS DE COMPONENTES

---

## 1. Headers de Página (3 padrões diferentes!)

### Padrão A: Páginas com AppLayout (usa `<Header />`)
```tsx
// HomePage, WalletPage, AnalysisPage, ProfilePage
<Header title="Título" showMonthSelector />
```
- Background: `bg-white/95` com `backdrop-blur-md`
- Border: `border-b border-slate-200`
- Padding: `px-4 py-4`

### Padrão B: Páginas fullscreen (header customizado)
```tsx
// NewCardPage, NewAccountPage, NewTransactionPage
<header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 z-20">
  <button className="h-10 w-10 rounded-full bg-white border...">
    <X />
  </button>
  <h1>Título</h1>
  <div className="w-10" />
</header>
```
- Background: `bg-slate-50` (SEM backdrop-blur!)
- Border: **NENHUM!**
- Botão X: customizado inline

### Padrão C: Páginas com `showBack` prop
```tsx
// SubscriptionsPage usa Header com showBack
<Header title="Assinaturas" showBack onBack={() => navigate('/wallet')} />
```
- Usa o componente Header
- Mostra ChevronLeft ao invés de X

### 🚨 PROBLEMA

1. **Background inconsistente**: `bg-white/95` vs `bg-slate-50`
2. **Backdrop-blur inconsistente**: Tem em algumas, não tem em outras
3. **Botão de fechar**: X vs ChevronLeft
4. **Border-bottom inconsistente**: Tem em algumas, não tem em outras

### ✅ RECOMENDAÇÃO

Criar um **único componente Header** que suporta todos os casos:

```tsx
<PageHeader 
  variant="default" | "fullscreen"
  title="Título"
  showBack?: boolean
  showClose?: boolean
  showMonthSelector?: boolean
/>
```

---

## 2. Cards de Lista (4 padrões diferentes!)

### Padrão A: CreditCardItem
```tsx
className="rounded-3xl p-6 shadow-lg border border-slate-100"
// Icon container: h-12 w-12 rounded-xl
// Font sizes: text-base (nome), text-2xl (valor)
```

### Padrão B: TransactionItem
```tsx
className="rounded-2xl p-4 border border-slate-100 shadow-sm"
// Icon container: h-12 w-12 rounded-xl
// Font sizes: text-sm (descrição), text-sm (valor)
```

### Padrão C: SubscriptionItem
```tsx
className="rounded-2xl border border-slate-100"
// Padding: p-4 no container interno
// Icon container: h-14 w-14 rounded-2xl
// Font sizes: font-bold (nome), text-lg font-black (valor)
```

### Padrão D: Account item (inline no WalletPage)
```tsx
className="rounded-3xl p-5 shadow-sm border border-slate-100"
// Icon container: h-12 w-12 rounded-2xl
// Font sizes: font-bold (nome), text-lg font-black (valor)
```

### 🚨 PROBLEMA

| Aspecto | CreditCard | Transaction | Subscription | Account |
|---------|------------|-------------|--------------|---------|
| Border radius | 3xl | 2xl | 2xl | 3xl |
| Padding | p-6 | p-4 | p-4 | p-5 |
| Shadow | shadow-lg | shadow-sm | none | shadow-sm |
| Icon size | 12x12 | 12x12 | 14x14 | 12x12 |
| Icon radius | xl | xl | 2xl | 2xl |

### ✅ RECOMENDAÇÃO

Criar um **ListCard** base:

```tsx
<ListCard
  icon={...}
  title="Nome"
  subtitle="Categoria"
  value="R$ 100,00"
  valueColor="income" | "expense" | "default"
  badge={<Badge>2/10</Badge>}
  onPress={() => {}}
  trailing={<ChevronRight />}
/>
```

---

## 3. Botões de Ação (Floating vs Inline)

### Página de Categorias
```tsx
// Botão fixo no bottom
<div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-50">
  <Button className="w-full">
    <Plus /> Criar Categoria
  </Button>
</div>
```

### Página de Assinaturas
```tsx
// Botão inline, não fixo
<Button className="w-full mb-6 h-14 text-base gap-3 bg-gradient-to-r from-violet-500...">
  <Plus /> Adicionar Assinatura
</Button>
```

### Página de Carteira (Cards tab)
```tsx
// Link texto simples
<button className="text-xs font-bold text-primary hover:underline">
  + Adicionar novo
</button>
```

### 🚨 PROBLEMA

Cada página tem um padrão diferente de CTA:
- Categorias: Botão fixo no bottom
- Assinaturas: Botão grande com gradiente
- Carteira: Link texto pequeno

### ✅ RECOMENDAÇÃO

Definir 2 padrões:
1. **CTA Principal**: Botão fixo no bottom (para ações principais)
2. **CTA Secundário**: Link texto alinhado à direita do título

---

## 4. Empty States (3 padrões!)

### Padrão A: Usando componente EmptyState
```tsx
// CategoriesPage
<EmptyState
  variant="categories"
  action={{ label: "Criar Categoria", onClick: () => {} }}
/>
```

### Padrão B: Card customizado
```tsx
// WalletPage - Cards
<Card className="p-8 text-center">
  <p className="text-slate-500 mb-4">Nenhum cartão cadastrado</p>
  <Button>Adicionar Cartão</Button>
</Card>
```

### Padrão C: Texto simples
```tsx
// TransactionList
<div className="text-center py-8 text-slate-500 text-sm">
  Nenhuma transação encontrada
</div>
```

### 🚨 PROBLEMA

O componente `EmptyState` foi criado mas não é usado consistentemente!

### ✅ RECOMENDAÇÃO

Usar `EmptyState` em TODOS os lugares:
- TransactionList
- WalletPage (cards, accounts, subscriptions)
- AnalysisPage

---

## 5. Modais e Dialogs

### Padrão A: InstallmentConfirmDialog
```tsx
// Overlay com backdrop-blur
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
  <Card className="relative z-10 w-full max-w-sm">
    ...
  </Card>
</div>
```

### Padrão B: SubscriptionItem dropdown
```tsx
// Dropdown absoluto sem overlay
<div className="absolute right-0 bottom-full mb-1 z-50 bg-white rounded-xl shadow-xl">
  ...
</div>
```

### Padrão C: confirm() nativo
```tsx
// SubscriptionsPage
if (confirm(`Deseja excluir "${name}"?`)) {
  // ...
}
```

### 🚨 PROBLEMA

- Alguns usam modal customizado
- Alguns usam dropdown posicionado
- Alguns usam `confirm()` nativo do browser!

### ✅ RECOMENDAÇÃO

Criar componentes:
1. `<ConfirmDialog>` - Para confirmações de exclusão
2. `<DropdownMenu>` - Para menus de ações
3. `<Modal>` - Para formulários e conteúdo complexo

---

# PARTE 3: PROBLEMAS DE UX

---

## 1. Feedback Visual

### Estados de Loading

| Página | Loading State |
|--------|---------------|
| HomePage | `DashboardSkeleton` ✅ |
| WalletPage | `Skeleton` inline ✅ |
| AnalysisPage | `Skeleton` inline ✅ |
| CategoriesPage | `Skeleton` ✅ |
| NewTransactionPage | Button `isLoading` ✅ |

✅ **Loading states estão OK.**

### Estados de Erro

| Página | Error Handling |
|--------|----------------|
| Todas | `QueryErrorBoundary` ✅ |
| Forms | Toast de erro ✅ |

✅ **Error handling está OK.**

### Estados Vazios
❌ **Inconsistente** (ver seção Empty States acima)

---

## 2. Touch Targets

### Análise de Tamanhos

| Elemento | Tamanho | Mínimo Recomendado | Status |
|----------|---------|-------------------|--------|
| Botão Header | 40x40px (`h-10 w-10`) | 44x44px | ⚠️ Pequeno |
| FAB (BottomNav) | 64x64px (`h-16 w-16`) | 44x44px | ✅ OK |
| NavItem | ~60x48px | 44x44px | ✅ OK |
| List items | Full width x ~80px | 44x44px | ✅ OK |
| MoreVertical button | 32x32px (`h-8 w-8`) | 44x44px | ❌ Muito pequeno! |

### 🚨 PROBLEMA

Botões de menu (`MoreVertical`, `MoreHorizontal`) são muito pequenos:
```tsx
// SubscriptionItem.tsx
<button className="h-8 w-8 rounded-lg...">
  <MoreVertical className="h-4 w-4" />
</button>
```

### ✅ RECOMENDAÇÃO

Mínimo `h-10 w-10` (40x40px) para botões de ação.

---

## 3. Hierarquia Visual

### HomePage
```
BalanceHero (destaque principal) ✅
CardOptimizer (destaque secundário) ✅
SubscriptionsSummary (card médio) ✅
ReliefChart (gráfico) ✅
TransactionList (lista) ✅
```
✅ **Hierarquia clara.**

### WalletPage
```
ConsolidatedBalance (hero) ✅
Tabs (navegação) ✅
Credit Summary (destaque no tab) ✅
Cards List (mesmo peso visual) ⚠️
```
⚠️ **Cards de crédito individuais competem visualmente com o summary.**

### AnalysisPage
```
Month Button (pequeno, centralizado) ⚠️
Summary Cards (scroll horizontal) ⚠️
MonthlyComparison (card grande) ✅
MonthlyTrendChart (gráfico) ✅
CategoryDistribution (pie chart) ✅
PendingBills (lista) ✅
```
⚠️ **O botão de mês deveria ser maior/mais destacado.**

---

## 4. Navegação

### Padrões Identificados

| De | Para | Método |
|----|------|--------|
| Home | TransactionDetail | ❌ Não implementado |
| Wallet | CardDetail | ❌ Rota não existe |
| Wallet | AccountEdit | ✅ navigate() |
| Wallet | Subscriptions | ✅ navigate() |
| Profile | Categories | ✅ navigate() |
| Profile | Household | ✅ navigate() |

### 🚨 PROBLEMA

Navegação para detalhes de cartão e transação não funciona.

---

## 5. Acessibilidade

### Problemas Identificados

1. **Sem `aria-label` em botões de ícone**
```tsx
// ❌ Sem aria-label
<button className="h-10 w-10...">
  <Bell className="h-5 w-5" />
</button>

// ✅ Com aria-label
<button aria-label="Notificações" className="h-10 w-10...">
  <Bell className="h-5 w-5" />
</button>
```

2. **Contraste de cores em `text-[10px]`**
- Texto muito pequeno pode ter problemas de legibilidade

3. **Focus states**
- Botões têm `focus-visible:ring-2` ✅
- Links customizados nem sempre têm focus visible ⚠️

---

# PARTE 4: RESUMO E PRIORIZAÇÃO

---

## Score de Consistência

| Área | Score | Notas |
|------|-------|-------|
| Border Radius | 4/10 | 6 variações diferentes |
| Tipografia | 5/10 | `text-[10px]` hardcoded 70x |
| Cores | 7/10 | Cores de banco hardcoded |
| Espaçamento | 5/10 | Padding de cards inconsistente |
| Componentes | 4/10 | Headers, cards, CTAs diferentes |
| Empty States | 3/10 | 3 padrões diferentes |
| Modais | 3/10 | confirm() nativo ainda usado |

**Score Geral: 4.4/10**

---

## Ações Prioritárias

### 🔴 P0 - Crítico (Fazer imediatamente)

1. **Criar Design Tokens**
   - Arquivo `tokens.css` ou constantes
   - Border radius: 3 tamanhos
   - Font sizes: Sistema definido
   - Spacing: 4px grid system

2. **Padronizar Headers**
   - Unificar `<Header>` e headers customizados
   - Mesmo background, blur, border em todas páginas

3. **Substituir confirm() nativo**
   - Criar `<ConfirmDialog>` component
   - Usar em todas exclusões

### 🟠 P1 - Alto (Próxima sprint)

4. **Criar componente ListCard**
   - Base para todos os items de lista
   - CreditCard, Transaction, Subscription, Account

5. **Padronizar Empty States**
   - Usar `<EmptyState>` em todos os lugares

6. **Aumentar touch targets**
   - Mínimo 40x40px em botões de ação

### 🟡 P2 - Médio (Backlog)

7. **Criar classe utilitária para labels**
   - `.label-overline` = text-[10px] font-bold uppercase tracking-wide

8. **Padronizar CTAs**
   - Definir quando usar botão fixo vs inline

9. **Adicionar aria-labels**
   - Botões de ícone sem texto

---

## Arquivos a Criar/Modificar

```
src/
├── styles/
│   └── tokens.css                 ← NOVO: Design tokens
├── components/
│   └── ui/
│       ├── confirm-dialog.tsx     ← NOVO: Modal de confirmação
│       ├── dropdown-menu.tsx      ← NOVO: Menu de ações
│       ├── list-card.tsx          ← NOVO: Card base para listas
│       └── page-header.tsx        ← NOVO: Header unificado
```

---

*Documento gerado pela análise do Versix Team Developers*
