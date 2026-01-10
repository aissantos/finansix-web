# 📋 CHANGELOG v1.6.0

**Data de Lançamento:** 10/01/2026  
**Base:** Finansix v1.5.0  
**Tipo:** Feature Release (Melhorias UX)

---

## 🎯 RESUMO

Versão focada em **melhorias na página de transações**, incluindo filtros avançados por data, export CSV e visualização de distribuição por categorias.

---

## ✨ NOVAS FEATURES

### 1. 🖼️ Logo Oficial nas Páginas de Autenticação

**Mudança:**  
Substituição do SVG customizado pela logo oficial PNG do Finansix.

**Implementação:**
```tsx
<img 
  src="/icons/icon-192x192.png" 
  alt="Finansix Logo" 
  className="h-24 w-24 rounded-3xl shadow-2xl shadow-primary/40"
/>
```

**Arquivos modificados:**
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`

**Benefícios:**
- ✅ Identidade visual oficial
- ✅ Consistência de marca
- ✅ Logo profissional e reconhecível
- ✅ Elementos decorativos mantidos (pulse animations)

---

### 2. 📅 Filtros de Data na Página de Transações

**Feature:**  
Filtro avançado por intervalo de datas na `AllTransactionsPage`.

**UI:**
```tsx
<div className="grid grid-cols-2 gap-2">
  <Input type="date" label="De" />
  <Input type="date" label="Até" />
</div>
```

**Funcionalidades:**
- ✅ Filtro "De" (data inicial)
- ✅ Filtro "Até" (data final)
- ✅ Pode usar apenas um dos filtros
- ✅ Combina com outros filtros (tipo, categoria, busca)
- ✅ Performance otimizada com `useMemo`

**Casos de uso:**
- Ver transações do último mês
- Filtrar por ano específico
- Análise de período personalizado
- Preparação de relatórios

---

### 3. 📥 Export de Transações (CSV)

**Feature:**  
Exportação de transações filtradas para arquivo CSV.

**Botão no painel de filtros:**
```tsx
<Button onClick={() => exportTransactions(filteredTransactions)}>
  📥 Exportar CSV
</Button>
```

**Formato CSV:**
```csv
Data,Descrição,Categoria,Tipo,Valor,Status,Parcelas
10/01/2026,"Supermercado","Alimentação","Despesa","R$ 250,00","completed","-"
09/01/2026,"Freelance","Trabalho","Receita","R$ 1500,00","completed","-"
```

**Funcionalidades:**
- ✅ Export apenas transações visíveis (filtradas)
- ✅ Formato compatível com Excel/Google Sheets
- ✅ Nome do arquivo: `finansix-transacoes-YYYY-MM-DD.csv`
- ✅ Encoding UTF-8 para acentuação
- ✅ Botão desabilitado quando sem transações

**Casos de uso:**
- Análise em planilhas
- Backup de dados
- Envio para contador
- Relatórios personalizados

---

### 4. 📊 Gráfico de Distribuição por Categoria

**Feature:**  
Visualização gráfica das top 5 categorias de despesas.

**Componente:**  
`CategoryDistributionChart` integrado na `AllTransactionsPage`.

**Visualização:**
```
Alimentação   ████████████████░░░░ R$ 1.250,00  35%
Transporte    ██████████░░░░░░░░░░ R$ 800,00   22%
Lazer         ████████░░░░░░░░░░░░ R$ 650,00   18%
```

**Informações exibidas:**
- ✅ Nome da categoria com cor
- ✅ Valor total gasto
- ✅ Percentual do total
- ✅ Número de transações
- ✅ Barra de progresso visual

**Funcionalidades:**
- ✅ Apenas despesas (não conta receitas)
- ✅ Top 5 categorias mais gastas
- ✅ Cores originais das categorias
- ✅ Animação suave nas barras
- ✅ Responsivo e mobile-friendly

**Benefícios:**
- Visualização rápida de onde vai o dinheiro
- Identificação de gastos excessivos
- Comparação visual entre categorias
- Insights para planejamento financeiro

---

## 🔄 MELHORIAS

### UI/UX
- ✅ Painel de filtros reorganizado
- ✅ Botões de ação lado a lado (Limpar + Exportar)
- ✅ Feedback visual quando sem transações para exportar
- ✅ Contagem de filtros ativos atualizada (inclui data)

### Performance
- ✅ Memoização de cálculos de categorias
- ✅ Filtros otimizados com `useMemo`
- ✅ Renderização condicional do gráfico

### Código
- ✅ Componente `CategoryDistributionChart` isolado
- ✅ Função `exportTransactions` reutilizável
- ✅ Type safety mantido
- ✅ Comentários em código complexo

---

## 📊 ESTATÍSTICAS

### Código

| Métrica | Valor |
|---------|-------|
| Features Novas | 4 |
| Arquivos Modificados | 3 |
| Linhas Adicionadas | ~200 |
| Componentes Novos | 1 (CategoryDistributionChart) |
| Funções Novas | 1 (exportTransactions) |

### Arquivos

**Modificados:**
- `src/pages/AllTransactionsPage.tsx` (+200 linhas)
- `src/pages/auth/LoginPage.tsx` (logo)
- `src/pages/auth/RegisterPage.tsx` (logo)
- `package.json` (versão 1.6.0)

---

## 🚀 COMO ATUALIZAR

### De v1.5.0 para v1.6.0

```bash
# 1. Pull latest
git pull origin main

# 2. Instalar dependências (se houver novas)
pnpm install

# 3. Build
pnpm build

# 4. Deploy
vercel --prod
```

**Nota:** Não há migrations SQL nesta versão.

---

## ⚠️ BREAKING CHANGES

**Nenhum!** Esta é uma atualização compatível com v1.5.0.

---

## 🐛 BUGS CONHECIDOS

Nenhum no momento.

---

## 📝 NOTAS DE USO

### Exportar Transações

1. Aplique os filtros desejados (data, tipo, categoria)
2. Clique em "📥 Exportar CSV" no painel de filtros
3. Arquivo será baixado automaticamente
4. Abra no Excel ou Google Sheets

### Filtro de Data

- **De:** Data inicial (inclusiva)
- **Até:** Data final (inclusiva)
- Pode usar apenas um campo
- Combina com outros filtros
- Limpar filtros remove datas também

### Gráfico de Categorias

- Mostra apenas as **5 categorias mais gastas**
- Considera apenas **despesas** (não receitas)
- Atualiza automaticamente quando filtros mudam
- Percentuais calculados sobre total de despesas visíveis

---

## 📈 ROADMAP FUTURO

### v1.7.0 (Planejado)
- 📊 Gráficos de evolução temporal
- 🎯 Metas de gastos por categoria
- 🔔 Alertas de gastos excessivos
- 📱 Notificações push (PWA)

### v2.0.0 (Futuro)
- Design system v2
- Atomic transactions
- Testing 80%+
- Performance otimizations

---

## 🙏 AGRADECIMENTOS

Equipe Versix Team Developers pela implementação das features.

---

**Versão:** 1.6.0  
**Data:** 10/01/2026  
**Status:** ✅ Production Ready
