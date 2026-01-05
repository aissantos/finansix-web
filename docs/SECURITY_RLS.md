# 🔐 Finansix Security: Row Level Security (RLS)

Este documento detalha a configuração de segurança do Finansix no Supabase.

## Visão Geral

O Finansix usa **Row Level Security (RLS)** do PostgreSQL para garantir isolamento de dados entre households. Cada usuário só pode acessar dados das famílias (households) às quais pertence.

## Modelo de Multi-tenancy

```
┌──────────────────────────────────────────────────────────────┐
│                         Household                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Owner   │  │  Admin   │  │  Member  │  │  Member  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Dados Isolados                     │    │
│  │  • Accounts    • Credit Cards    • Transactions     │    │
│  │  • Categories  • Installments    • Statements       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| `owner` | Criador do household | Tudo + deletar household |
| `admin` | Administrador | Tudo + gerenciar membros |
| `member` | Membro regular | CRUD em dados financeiros |
| `viewer` | Somente leitura | Apenas visualização |

## Políticas RLS por Tabela

### 1. `households`

```sql
-- SELECT: Usuários veem apenas seus households
USING (id = ANY(get_user_household_ids()))

-- UPDATE: Apenas owners podem atualizar
USING (id IN (SELECT hm.household_id FROM household_members hm WHERE hm.user_id = auth.uid() AND hm.role = 'owner'))
```

### 2. `transactions`, `accounts`, `credit_cards`, `installments`

```sql
-- SELECT, INSERT, UPDATE, DELETE: Baseado em household_id
USING (household_id = ANY(get_user_household_ids()))
```

### 3. `categories`

```sql
-- SELECT: Categorias default (NULL) + do household
USING (household_id IS NULL OR household_id = ANY(get_user_household_ids()))
```

## Função Helper

```sql
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT household_id 
    FROM household_members 
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Esta função é marcada como `SECURITY DEFINER` para executar com privilégios elevados, e `STABLE` para permitir caching dentro de uma transação.

## Verificação de Segurança

### Checklist de Deploy

- [ ] **RLS habilitado** em todas as tabelas
- [ ] **Nenhuma policy permite** `USING (true)`
- [ ] **Service Role Key** nunca exposta no frontend
- [ ] **Anon Key** usada apenas no cliente
- [ ] **Testes de isolamento** executados

### Comandos de Verificação

```sql
-- Listar tabelas sem RLS
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND NOT rowsecurity;

-- Listar policies por tabela
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Testes de Penetração

### Cenário 1: Acesso Cross-Household

```sql
-- Com user A (household: H1), tentar acessar dados do household H2
SELECT * FROM transactions WHERE household_id = 'H2';
-- Esperado: 0 rows (RLS filtra automaticamente)
```

### Cenário 2: Bypass via SQL Injection

```javascript
// Tentativa de injection no frontend
const response = await supabase
  .from('transactions')
  .select('*')
  .eq('household_id', "' OR '1'='1");
// Esperado: Erro ou 0 rows (Supabase escapa automaticamente)
```

### Cenário 3: Modificar household_id

```javascript
// Tentativa de inserir em outro household
await supabase.from('transactions').insert({
  household_id: 'outro-household-id', // <- tentativa de bypass
  amount: 100,
});
// Esperado: Erro (WITH CHECK falha)
```

## Troubleshooting

### "new row violates row-level security policy"

**Causa**: Tentativa de inserir/atualizar dados em household não autorizado.

**Solução**: Verificar se o `household_id` pertence ao usuário logado.

### Queries retornando menos dados que esperado

**Causa provável**: RLS filtrando rows silenciosamente.

**Debug**:
```sql
-- Verificar households do usuário
SELECT get_user_household_ids();

-- Verificar se dados existem (como admin)
SET ROLE service_role;
SELECT * FROM transactions WHERE ...;
RESET ROLE;
```

## Auditoria

Recomenda-se configurar logging para queries sensíveis:

```sql
-- Habilitar log de statements
ALTER SYSTEM SET log_statement = 'mod';

-- Criar audit trigger (exemplo)
CREATE TABLE audit_log (
  id uuid DEFAULT gen_random_uuid(),
  table_name text,
  action text,
  user_id uuid,
  household_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);
```

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Access Control](https://owasp.org/www-community/Access_Control)

---

**Última atualização**: Janeiro 2025
**Responsável**: Versix Security Team
