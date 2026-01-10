# 🔧 RELEASE NOTES - FINANSIX v1.5.2.2

**Data:** 10 de Janeiro de 2026  
**Tipo:** Bug Fixes + UX Enhancement  
**Base:** v1.5.1.0  
**Status:** ✅ PRODUCTION READY

---

## 📊 RESUMO EXECUTIVO

Esta release corrige bugs críticos identificados em produção e adiciona melhoria de UX para o bottom nav.

### Problemas Corrigidos

✅ **Erro 404** - View `transactions_with_installments_expanded` não existe  
✅ **Erro 400** - Campos inválidos ao criar conta bancária  
✅ **UX Enhancement** - Bottom nav hide/show on scroll

---

## 🐛 BUG FIXES

### 1. ✅ Erro 404 - transactions_with_installments_expanded

**Problema:**
```
Failed to load resource: 404
GET .../transactions_with_installments_expanded?select=*...
```

**Causa:**
O código estava tentando acessar uma view `transactions_with_installments_expanded` que não existe no banco de dados.

**Solução:**
Alterado `src/lib/supabase/transactions.ts` para usar a tabela `transactions` diretamente com JOINs:

```typescript
// ANTES (incorreto)
.from('transactions_with_installments_expanded')
.select(`*, category:category_id(...), ...`)

// DEPOIS (correto)
.from('transactions')
.select(`*, category:categories(...), ...`)
```

---

### 2. ✅ Erro 400 - Criar Conta Bancária

**Problema:**
```
POST .../accounts?select=* 400 (Bad Request)
```

**Causa:**
O formulário de nova conta estava enviando campos que não existem na tabela `accounts` (bank_code, bank_name, branch_number, account_number, account_digit, pix_key, pix_key_type).

**Solução:**
Alterado `src/lib/supabase/accounts.ts` para filtrar apenas campos válidos:

```typescript
export async function createAccount(account: InsertTables<'accounts'>) {
  // Filter only valid database columns
  const validFields = {
    household_id: account.household_id,
    name: account.name,
    type: account.type,
    currency: account.currency ?? 'BRL',
    initial_balance: account.initial_balance ?? 0,
    current_balance: account.initial_balance ?? 0,
    color: account.color,
    icon: account.icon,
    is_active: account.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert(validFields)
    .select()
    .single();
  // ...
}
```

**Nota:** Os campos bancários (bank_code, bank_name, etc.) ainda aparecem no formulário mas são ignorados no envio. Em uma versão futura, esses campos devem ser adicionados à tabela do banco de dados ou removidos do formulário.

---

## ✨ NOVA FEATURE

### 3. ✅ Bottom Nav Hide on Scroll

**Descrição:**
O menu de navegação inferior agora oculta automaticamente quando o usuário rola para baixo, e reaparece quando rola para cima. Isso dá mais espaço de tela para o conteúdo.

**Comportamento:**
- **Scroll ↓ (down)**: Menu desliza para baixo e desaparece
- **Scroll ↑ (up)**: Menu desliza para cima e reaparece
- **Threshold**: 15px para evitar triggers acidentais
- **Animação**: Spring animation (smooth, não linear)

**Arquivos Criados:**
```
src/hooks/useScrollDirection.ts  [NOVO]
```

**Arquivos Modificados:**
```
src/hooks/index.ts               [+export]
src/components/layout/BottomNav.tsx [Refatorado]
```

**Implementação:**
```typescript
// useScrollDirection.ts
export function useScrollDirection(options = {}) {
  const { threshold = 10 } = options;
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  // ... requestAnimationFrame + scroll listener
  return scrollDirection;
}

// BottomNav.tsx
const scrollDirection = useScrollDirection({ threshold: 15 });
const isHidden = scrollDirection === 'down';

<motion.nav
  animate={{ y: isHidden ? 100 : 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
  ...
</motion.nav>
```

---

## 📁 ARQUIVOS ALTERADOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useScrollDirection.ts` | **NOVO** | Hook para detectar direção do scroll |
| `src/hooks/index.ts` | Modificado | Adicionado export do novo hook |
| `src/components/layout/BottomNav.tsx` | Modificado | Animação hide/show com Framer Motion |
| `src/lib/supabase/transactions.ts` | Modificado | Usar tabela `transactions` ao invés da view |
| `src/lib/supabase/accounts.ts` | Modificado | Filtrar campos válidos no insert |
| `README.md` | Modificado | Atualizado para v1.5.2.2 |

---

## 📦 INSTALAÇÃO

```bash
# 1. Extrair
tar -xzf finansix-v1.5.2.2-bugfixes.tar.gz
cd finansix-web

# 2. Instalar dependências
pnpm install

# 3. Desenvolvimento
pnpm dev

# 4. Build
pnpm build
```

**Nota:** Esta release NÃO requer migrations SQL.

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Bug Fixes
- [x] Transações carregam corretamente (sem erro 404)
- [x] Nova conta bancária é criada com sucesso (sem erro 400)
- [x] Campos bancários opcionais são ignorados no envio

### Nova Feature
- [x] Bottom nav oculta ao rolar para baixo
- [x] Bottom nav reaparece ao rolar para cima
- [x] Animação suave (spring)
- [x] FAB também anima junto

### Regressão
- [x] Navegação funciona normalmente
- [x] Páginas sem nav continuam sem nav (/transactions/new, /auth)
- [x] Transições de página mantidas

---

## 🔄 COMPATIBILIDADE

- ✅ Totalmente compatível com v1.5.1.0
- ✅ Não requer alterações no banco de dados
- ✅ Não há breaking changes

---

## 🎯 PRÓXIMOS PASSOS

### v1.5.3.0 (Planejado)
- [ ] Adicionar colunas bancárias à tabela `accounts` (bank_code, etc.)
- [ ] Ou remover campos bancários do formulário
- [ ] Pull-to-refresh nas listas

### v1.6.0 (Roadmap)
- [ ] Test coverage 40%+
- [ ] Dashboard widgets
- [ ] Category insights

---

**FINANSIX v1.5.2.2 - Bug Fixes + UX**  
**Versix Team Developers**  
10 de Janeiro de 2026

✅ **BUGS CRÍTICOS CORRIGIDOS**  
✅ **BOTTOM NAV HIDE ON SCROLL**  
✅ **README ATUALIZADO**

🚀 **PRONTO PARA PRODUÇÃO**
