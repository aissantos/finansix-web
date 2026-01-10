# 🚀 GUIA DE INSTALAÇÃO - FINANSIX v1.7.0

## ⚠️ IMPORTANTE - NOVA DEPENDÊNCIA

Esta versão adiciona a dependência `@radix-ui/react-alert-dialog` que precisa ser instalada.

---

## 📦 INSTALAÇÃO COMPLETA

```bash
# 1. Extrair o pacote
tar -xzf finansix-v1.7.0-UX-REVOLUTION-FINAL.tar.gz
cd finansix-v1.4.0

# 2. Instalar dependências (IMPORTANTE!)
pnpm install

# 3. Build
pnpm build

# 4. Verificar se compilou sem erros
# ✅ Deve mostrar: "vite v5.x.x building for production... ✓ built in Xs"

# 5. Deploy
vercel --prod
```

---

## 🔧 NOVA DEPENDÊNCIA ADICIONADA

```json
"@radix-ui/react-alert-dialog": "^1.1.2"
```

Esta dependência é necessária para o componente `DeleteConfirmDialog`.

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após instalação, verificar:

- [ ] `pnpm install` executou sem erros
- [ ] `pnpm build` compilou com sucesso
- [ ] Arquivo `dist/` foi gerado
- [ ] Deploy funcionou corretamente

---

## 📊 COMPONENTES ADICIONADOS

### Componentes UI Shadcn

1. **dialog.tsx** - Modal base
2. **alert-dialog.tsx** - Diálogo de alerta/confirmação

### Componentes Customizados

1. **DeleteConfirmDialog** - Modal de confirmação de exclusão
2. **EditTransactionModal** - Modal de edição inline
3. **ContextualFAB** - FAB inteligente contextual

---

## 🐛 TROUBLESHOOTING

### Erro: "Could not load alert-dialog"

**Solução:**
```bash
# Forçar reinstalação
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: Build falha com dependencies

**Solução:**
```bash
# Verificar versão do pnpm
pnpm --version  # Deve ser >= 9.x

# Limpar cache
pnpm store prune
pnpm install
```

### Build bem-sucedido mas deploy falha

**Solução:**
```bash
# Verificar se dist/ foi gerado
ls -la dist/

# Fazer deploy manual
vercel --prod --force
```

---

## 📝 NOTAS ADICIONAIS

- O pacote já inclui o `package.json` atualizado com todas as dependências
- Executar `pnpm install` é **obrigatório** antes do build
- O primeiro build pode demorar ~30s devido às novas dependências
- Builds subsequentes serão mais rápidos (~5s)

---

## ✅ VALIDAÇÃO FINAL

Após deploy, testar:

1. **Editar transação**
   - Abrir HomePage
   - Click no menu ⋮ de uma transação
   - Click "Editar"
   - Modal deve abrir inline ✅

2. **Excluir transação**
   - Click no menu ⋮
   - Click "Excluir"
   - Dialog de confirmação deve aparecer ✅

3. **FAB contextual**
   - Navegar entre páginas
   - FAB deve aparecer/desaparecer conforme contexto ✅

---

**Versão:** 1.7.0 UX REVOLUTION  
**Data:** 10/01/2026  
**Status:** ✅ PRONTO PARA PRODUÇÃO
