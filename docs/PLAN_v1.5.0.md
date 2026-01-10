# 🔧 PLANO DE CORREÇÕES v1.5.0

**Data:** 10/01/2026  
**Base:** Finansix v1.4.0

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. ❌ Somatório de Cartão com Parcelas Deletadas
**Problema:** View `credit_card_limits` não filtra `deleted_at` nas parcelas  
**Impacto:** Limite disponível calculado incorretamente  
**Severidade:** 🔴 CRÍTICO

**Solução:**
```sql
-- Adicionar filtro AND i.deleted_at IS NULL em ambas subconsultas da view
```

### 2. 🖼️ Logo Pequena na Página de Login
**Problema:** Logo atual é apenas letra "F" em div  
**Solução:** Usar logo oficial maior

### 3. 📊 Feed de Transações na AnalysisPage
**Problema:** Falta feed de transações recentes  
**Solução:**
- Adicionar seção "Últimas Transações" (10 items)
- Botão "Ver todas"
- Página dedicada de transações com filtros

---

## 📝 TAREFAS

### TASK 1: Corrigir View credit_card_limits
- [ ] Criar migration para atualizar view
- [ ] Adicionar filtro deleted_at em subconsultas
- [ ] Testar cálculo de limites

### TASK 2: Atualizar Logo de Login
- [ ] Adicionar logo oficial em public/
- [ ] Atualizar LoginPage.tsx
- [ ] Atualizar RegisterPage.tsx

### TASK 3: Feed de Transações
- [ ] Criar componente RecentTransactionsFeed
- [ ] Adicionar na AnalysisPage
- [ ] Criar página AllTransactionsPage com filtros
- [ ] Adicionar rota

### TASK 4: Documentação
- [ ] Atualizar CHANGELOG para v1.5.0
- [ ] Documentar mudanças

---

## 🚀 EXECUÇÃO

Sequência de implementação:
1. Migration da view (mais crítico)
2. Logo de login (rápido)
3. Feed de transações (feature nova)
4. Documentação final
