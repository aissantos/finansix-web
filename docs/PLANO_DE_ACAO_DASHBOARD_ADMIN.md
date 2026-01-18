# PLANO DE AÇÃO: IMPLEMENTAÇÃO DO DASHBOARD SUPER ADMIN - FINANSIX
## Versão 1.0 | Data: 17 Janeiro 2026 | Preparado por: Versix Team Developers

---

## 📋 SUMÁRIO EXECUTIVO

### Objetivo
Implementar o Dashboard Super Admin do Finansix, passando do protótipo HTML para uma aplicação React/TypeScript production-ready, integrada ao backend Supabase, com todas as funcionalidades de gestão, monitoramento e analytics.

### Escopo Total
- **8 páginas principais** (Dashboard, Analytics, Users, Transactions, System Health, Feature Flags, Audit Log, User Detail)
- **Integração completa** com backend Supabase
- **Sistema de autenticação** e RBAC (4 níveis de permissão)
- **Real-time monitoring** e observabilidade
- **Testes automatizados** (E2E, Integration, Unit)

### Timeline Resumido
- **Duração total:** 10-12 semanas (2.5-3 meses)
- **5 Sprints** de 2 semanas cada
- **1-2 semanas** de buffer/polish antes do lançamento
- **Data de lançamento estimada:** Abril 2026

### Recursos Necessários
- **1 Tech Lead / Arquiteto** (full-time)
- **2 Frontend Engineers** (Senior, full-time)
- **1 Backend Engineer** (Senior, 50%)
- **1 DevOps/SRE** (25-50%)
- **1 Product Manager** (25%)
- **1 Designer** (25% - reviews e ajustes)

### Investimento Estimado
- **Horas de engenharia:** ~1,200-1,400 horas
- **Custo estimado:** R$ 180k-240k (considerando taxas de mercado)

---

## 🎯 OBJETIVOS E MÉTRICAS DE SUCESSO

### KPIs de Implementação
1. **Cobertura de Testes:** ≥80% (E2E + Integration + Unit)
2. **Performance:** Lighthouse Score ≥90
3. **Latência p95:** <500ms para todas as queries
4. **Bug Rate:** <0.5% após lançamento
5. **Adoção:** 100% dos admins usando em 2 semanas

### Critérios de Aceitação (DoD - Definition of Done)
- [ ] Todas as features do protótipo implementadas
- [ ] Testes E2E cobrindo fluxos críticos
- [ ] Documentação técnica completa
- [ ] Audit log registrando 100% das ações sensíveis
- [ ] Performance benchmarks atingidos
- [ ] Security review aprovado
- [ ] Runbook operacional criado
- [ ] Training session com equipe realizado

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológico

#### Frontend
```typescript
// Core
- React 18.3.1
- TypeScript 5.6+
- Vite 5.4+

// State Management
- Zustand 4.5+ (global state)
- TanStack Query 5.x (server state)

// UI/Styling
- TailwindCSS 3.4+
- Shadcn/UI (component library)
- Framer Motion (animations)

// Data Visualization
- Recharts 2.x (charts)
- TanStack Table 8.x (tables)

// Forms & Validation
- React Hook Form 7.x
- Zod 3.x

// Utils
- date-fns 3.x
- lucide-react (icons)
```

#### Backend
```sql
-- Supabase Stack
- PostgreSQL 15.2+
- PostgREST (API)
- Edge Functions (Deno/TypeScript)
- Row Level Security (RLS)

-- Observability
- Sentry (error tracking)
- PostHog/Mixpanel (analytics)
- Custom metrics (Prometheus)
```

#### DevOps
```yaml
# Infrastructure
- Vercel/Cloudflare Pages (hosting)
- GitHub Actions (CI/CD)
- Supabase Cloud (backend)

# Monitoring
- Uptime Robot / Better Uptime
- Datadog / New Relic (APM)
```

### Estrutura de Pastas
```
src/
├── admin/                          # Admin-only code
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── metrics/
│   │   │   ├── MetricCard.tsx
│   │   │   └── MetricsGrid.tsx
│   │   ├── tables/
│   │   │   ├── DataTable.tsx
│   │   │   └── columns/
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── DonutChart.tsx
│   │   │   └── FunnelChart.tsx
│   │   └── modals/
│   │       ├── ImpersonateModal.tsx
│   │       └── ConfirmActionModal.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   ├── Users/
│   │   │   ├── UsersList.tsx
│   │   │   ├── UserDetail.tsx
│   │   │   └── components/
│   │   ├── Transactions/
│   │   ├── SystemHealth/
│   │   ├── FeatureFlags/
│   │   └── AuditLog/
│   ├── hooks/
│   │   ├── useAdminAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── useDashboardMetrics.ts
│   │   ├── useUserManagement.ts
│   │   └── useAuditLog.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── supabase-admin.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── admin.ts
│   │   ├── metrics.ts
│   │   └── audit.ts
│   └── stores/
│       ├── adminStore.ts
│       └── filterStore.ts
├── shared/                         # Shared with main app
│   ├── components/
│   ├── hooks/
│   └── utils/
└── types/
    └── database.types.ts           # Auto-generated from Supabase
```

---

## 🚀 ROADMAP DE SPRINTS

---

## **SPRINT 0: SETUP & FOUNDATION** (1 semana, antes do Sprint 1)

### Objetivos
Preparar ambiente de desenvolvimento, infraestrutura base e scaffolding do projeto.

### Tasks

#### 1. Infraestrutura (DevOps/Backend) - 16h
- [ ] Criar projeto Supabase separado para admin (ou schema isolado)
- [ ] Configurar variáveis de ambiente (`.env.admin`)
- [ ] Setup GitHub Actions para CI/CD admin
- [ ] Configurar Sentry para error tracking
- [ ] Configurar PostHog/Mixpanel para analytics

**Entregável:** Repositório configurado + pipelines rodando

#### 2. Database Schema (Backend) - 12h
```sql
-- Criar tabelas base
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support', 'analyst')),
    totp_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    result TEXT CHECK (result IN ('success', 'failure')),
    error_message TEXT
);

CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id),
    user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_segment TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_impersonation_active ON impersonation_sessions(is_active, admin_id);
```

**Entregável:** Schema aplicado + migrations versionadas

#### 3. Frontend Scaffolding (Frontend Lead) - 12h
```bash
# Criar estrutura base
npx create-vite finansix-admin --template react-ts
cd finansix-admin

# Instalar dependências
npm install @tanstack/react-query @tanstack/react-table zustand
npm install @supabase/supabase-js
npm install tailwindcss @shadcn/ui
npm install react-hook-form zod @hookform/resolvers
npm install recharts lucide-react date-fns
npm install framer-motion

# Setup TailwindCSS
npx tailwindcss init -p
```

```typescript
// src/admin/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
```

**Entregável:** Projeto React configurado + rotas base

#### 4. Design Tokens & Theme (Frontend) - 8h
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
          accent: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
          },
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

**Entregável:** Design system configurado + componentes base do Shadcn

---

## **SPRINT 1: AUTENTICAÇÃO & LAYOUT BASE** (2 semanas)

### Objetivos
Implementar sistema de autenticação robusto para admins, RBAC completo e layout base responsivo.

### Story Points: 34

---

### **EPIC 1.1: Sistema de Autenticação Admin**

#### User Story 1.1.1: Login de Admin
**Como** super admin  
**Quero** fazer login com email/senha + 2FA  
**Para** acessar o dashboard de forma segura

**Critérios de Aceitação:**
- [ ] Página de login com validação de formulário (Zod)
- [ ] Integração com Supabase Auth
- [ ] Suporte a 2FA (TOTP) obrigatório para super_admin
- [ ] Mensagens de erro claras
- [ ] Redirect para dashboard após login
- [ ] Session management (auto-refresh)

**Tasks Técnicos:**
```typescript
// src/admin/pages/Login.tsx
export function AdminLogin() {
  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: LoginForm) => {
      const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      
      if (error) throw error
      
      // Verificar se é admin
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', data.email)
        .single()
      
      if (!adminUser) throw new Error('Não autorizado')
      
      return { authData, adminUser }
    },
    onSuccess: ({ adminUser }) => {
      // Log audit
      logAuditEvent({
        action: 'admin_login',
        admin_id: adminUser.id,
        result: 'success',
      })
      
      navigate('/admin/dashboard')
    },
  })
  
  // ... render
}
```

**Estimativa:** 8 SP / 16h

---

#### User Story 1.1.2: 2FA Setup
**Como** admin  
**Quero** configurar 2FA no primeiro login  
**Para** garantir segurança da conta

**Critérios de Aceitação:**
- [ ] Modal de setup com QR code
- [ ] Validação do código TOTP
- [ ] Armazenamento seguro do secret
- [ ] Códigos de backup gerados

**Tasks Técnicos:**
```typescript
// src/admin/components/2FA/Setup2FA.tsx
import { authenticator } from 'otplib'

export function Setup2FA() {
  const generateSecret = () => {
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(
      user.email,
      'Finansix Admin',
      secret
    )
    return { secret, otpauth }
  }
  
  const verify = async (token: string) => {
    const isValid = authenticator.verify({ token, secret })
    if (isValid) {
      await supabaseAdmin
        .from('admin_users')
        .update({ totp_secret: secret })
        .eq('id', user.id)
    }
  }
  
  // ... render QR code + input
}
```

**Estimativa:** 5 SP / 10h

---

#### User Story 1.1.3: RBAC - Sistema de Permissões
**Como** sistema  
**Quero** controlar permissões granulares por role  
**Para** garantir que cada admin veja/faça apenas o permitido

**Critérios de Aceitação:**
- [ ] 4 roles implementados (super_admin, admin, support, analyst)
- [ ] Permission checks em todas as actions
- [ ] RLS policies no Supabase
- [ ] Hook `usePermissions()` funcional

**Tasks Técnicos:**
```typescript
// src/admin/lib/permissions.ts
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: ['super_admin', 'admin', 'support', 'analyst'],
  
  // Users
  VIEW_USERS: ['super_admin', 'admin', 'support', 'analyst'],
  EDIT_USERS: ['super_admin', 'admin'],
  DELETE_USERS: ['super_admin', 'admin'],
  IMPERSONATE_USERS: ['super_admin', 'admin'],
  
  // System
  VIEW_SYSTEM_HEALTH: ['super_admin', 'admin', 'support'],
  APPLY_MIGRATIONS: ['super_admin'],
  MANAGE_FEATURE_FLAGS: ['super_admin', 'admin'],
  
  // Security
  VIEW_AUDIT_LOG: ['super_admin', 'admin', 'support'],
  MANAGE_ADMINS: ['super_admin'],
} as const

export function hasPermission(
  userRole: AdminRole,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

// Hook
export function usePermissions() {
  const { user } = useAdminAuth()
  
  return {
    can: (permission: keyof typeof PERMISSIONS) => {
      return hasPermission(user.role, permission)
    },
    role: user.role,
  }
}
```

```sql
-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Only super_admins can manage admins"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
```

**Estimativa:** 8 SP / 16h

---

### **EPIC 1.2: Layout & Navegação**

#### User Story 1.2.1: Layout Base Responsivo
**Como** admin  
**Quero** um layout consistente em todas as páginas  
**Para** ter uma experiência fluida de navegação

**Critérios de Aceitação:**
- [ ] Sidebar fixa com navegação
- [ ] Header com breadcrumb + user menu
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] Tema dark aplicado

**Tasks Técnicos:**
```typescript
// src/admin/components/layout/AdminLayout.tsx
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAdminAuth()
  const { pathname } = useLocation()
  
  return (
    <div className="flex min-h-screen bg-admin-primary">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <Header 
          breadcrumb={getBreadcrumb(pathname)}
          user={user}
        />
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

// src/admin/components/layout/Sidebar.tsx
export function Sidebar() {
  const { pathname } = useLocation()
  const { can } = usePermissions()
  
  const navItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/admin/dashboard',
      permission: 'VIEW_DASHBOARD',
    },
    {
      label: 'Analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      permission: 'VIEW_DASHBOARD',
    },
    // ... outros items
  ].filter(item => can(item.permission))
  
  return (
    <aside className="w-64 bg-admin-secondary border-r border-admin-tertiary">
      {/* Logo */}
      {/* Nav items */}
    </aside>
  )
}
```

**Estimativa:** 8 SP / 16h

---

#### User Story 1.2.2: Navegação com Active States
**Como** admin  
**Quero** ver visualmente qual página estou  
**Para** não me perder na navegação

**Critérios de Aceitação:**
- [ ] Active state visual no menu
- [ ] Breadcrumb dinâmico
- [ ] Transitions suaves

**Estimativa:** 3 SP / 6h

---

#### User Story 1.2.3: Search Global (⌘K)
**Como** admin  
**Quero** buscar usuários/transações rapidamente com ⌘K  
**Para** acessar informações sem navegar

**Critérios de Aceitação:**
- [ ] Modal de busca com ⌘K
- [ ] Busca em users, transactions
- [ ] Navegação com keyboard (↑↓ Enter)
- [ ] Resultados com highlight

**Tasks Técnicos:**
```typescript
// src/admin/components/search/GlobalSearch.tsx
export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  
  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query) return []
      
      const [users, transactions] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id, name, email')
          .ilike('name', `%${query}%`)
          .limit(5),
        
        supabaseAdmin
          .from('transactions')
          .select('id, description, value')
          .ilike('description', `%${query}%`)
          .limit(5),
      ])
      
      return {
        users: users.data || [],
        transactions: transactions.data || [],
      }
    },
    enabled: query.length > 2,
  })
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  
  // ... render Command palette
}
```

**Estimativa:** 5 SP / 10h

---

### Entregáveis do Sprint 1
- [ ] Login funcional com 2FA
- [ ] RBAC implementado
- [ ] Layout base responsivo
- [ ] Navegação funcional
- [ ] Search global (⌘K)
- [ ] Testes E2E do fluxo de auth

**Total Sprint 1:** 34 SP (~68h de engenharia)

---

## **SPRINT 2: DASHBOARD & MÉTRICAS** (2 semanas)

### Objetivos
Implementar página principal do dashboard com métricas em tempo real, activity feed e tabela de usuários recentes.

### Story Points: 40

---

### **EPIC 2.1: Métricas do Dashboard**

#### User Story 2.1.1: Metric Cards com Real-Time Updates
**Como** admin  
**Quero** ver métricas principais atualizadas em tempo real  
**Para** monitorar a saúde do sistema

**Critérios de Aceitação:**
- [ ] 4 metric cards: Active Users, Transactions, System Health, Error Rate
- [ ] Auto-refresh a cada 30s
- [ ] Loading skeletons
- [ ] Animações de entrada
- [ ] Delta vs período anterior

**Tasks Técnicos:**
```typescript
// src/admin/hooks/useDashboardMetrics.ts
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .rpc('get_dashboard_metrics')
      
      if (error) throw error
      return data as DashboardMetrics
    },
    refetchInterval: 30000, // 30s
  })
}

// Supabase RPC
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH metrics AS (
    SELECT
      -- Active Users (last 24h)
      (SELECT COUNT(DISTINCT user_id) 
       FROM user_sessions 
       WHERE created_at > NOW() - INTERVAL '24 hours') AS active_users,
      
      -- Active Users Yesterday
      (SELECT COUNT(DISTINCT user_id) 
       FROM user_sessions 
       WHERE created_at BETWEEN NOW() - INTERVAL '48 hours' 
         AND NOW() - INTERVAL '24 hours') AS active_users_yesterday,
      
      -- Transactions Today
      (SELECT COUNT(*) 
       FROM transactions 
       WHERE DATE(created_at) = CURRENT_DATE) AS transactions_today,
      
      -- Transactions Yesterday
      (SELECT COUNT(*) 
       FROM transactions 
       WHERE DATE(created_at) = CURRENT_DATE - 1) AS transactions_yesterday,
      
      -- Error Rate (last 1h)
      (SELECT ROUND(
        (COUNT(*) FILTER (WHERE status >= 400)::DECIMAL / 
         NULLIF(COUNT(*), 0) * 100), 2
       ) FROM api_logs 
       WHERE created_at > NOW() - INTERVAL '1 hour') AS error_rate,
      
      -- System Health (uptime %)
      (SELECT 99.9) AS system_health -- TODO: calcular real
  )
  SELECT json_build_object(
    'activeUsers', json_build_object(
      'value', active_users,
      'delta', ROUND((active_users - active_users_yesterday)::DECIMAL / 
                     NULLIF(active_users_yesterday, 0) * 100, 1)
    ),
    'transactionsToday', json_build_object(
      'value', transactions_today,
      'delta', ROUND((transactions_today - transactions_yesterday)::DECIMAL / 
                     NULLIF(transactions_yesterday, 0) * 100, 1)
    ),
    'errorRate', json_build_object(
      'value', error_rate,
      'delta', -0.3 -- TODO: calcular delta real
    ),
    'systemHealth', json_build_object(
      'value', system_health,
      'incidents', 0
    )
  ) INTO result FROM metrics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// src/admin/components/metrics/MetricCard.tsx
export function MetricCard({ 
  title, 
  value, 
  delta, 
  icon: Icon 
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-admin-secondary border border-admin-tertiary rounded-2xl p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase">
          {title}
        </h3>
        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-500" />
        </div>
      </div>
      
      <div className="text-4xl font-bold font-mono mb-2">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      
      {delta !== undefined && (
        <div className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-gray-400"
        )}>
          {delta > 0 ? <TrendingUp className="w-4 h-4" /> : 
           delta < 0 ? <TrendingDown className="w-4 h-4" /> : 
           <Minus className="w-4 h-4" />}
          <span>{Math.abs(delta)}% vs ontem</span>
        </div>
      )}
    </motion.div>
  )
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 2.1.2: Activity Feed com Real-Time
**Como** admin  
**Quero** ver atividades críticas em tempo real  
**Para** reagir rapidamente a problemas

**Critérios de Aceitação:**
- [ ] Feed de últimas 10 atividades
- [ ] Tipos: impersonation, migration, rate_limit, config_change
- [ ] Real-time via Supabase Realtime
- [ ] Icons e cores por tipo

**Tasks Técnicos:**
```typescript
// src/admin/hooks/useActivityFeed.ts
export function useActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  
  // Initial fetch
  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)
      
      return data
    },
  })
  
  // Real-time subscription
  useEffect(() => {
    const channel = supabaseAdmin
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev].slice(0, 10))
          
          // Show toast notification
          toast({
            title: getActivityTitle(payload.new.action),
            description: payload.new.metadata?.description,
          })
        }
      )
      .subscribe()
    
    return () => {
      supabaseAdmin.removeChannel(channel)
    }
  }, [])
  
  return {
    activities: activities.length > 0 ? activities : data,
    isLoading,
  }
}
```

**Estimativa:** 8 SP / 16h

---

### **EPIC 2.2: Tabela de Usuários Recentes**

#### User Story 2.2.1: Tabela com TanStack Table
**Como** admin  
**Quero** ver usuários recentes numa tabela rica  
**Para** acessar rapidamente suas informações

**Critérios de Aceitação:**
- [ ] TanStack Table configurado
- [ ] Colunas: Avatar, Nome, Email, Household, Transações, Data, Status
- [ ] Sorting por coluna
- [ ] Row selection
- [ ] Click na row → navega para user detail

**Tasks Técnicos:**
```typescript
// src/admin/components/tables/UsersTable.tsx
export function UsersTable() {
  const navigate = useNavigate()
  
  const { data, isLoading } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          name,
          email,
          created_at,
          is_active,
          households!inner(name),
          transactions(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      return data
    },
  })
  
  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Usuário',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-sm text-gray-400">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'households.name',
      header: 'Household',
    },
    {
      accessorKey: 'transactions',
      header: 'Transações',
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          {row.original.transactions[0].count}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
          {row.original.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => <UserRowActions user={row.original} />,
    },
  ], [])
  
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  
  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
    />
  )
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 2.2.2: Row Actions (View, Edit, Impersonate)
**Como** admin  
**Quero** ações rápidas em cada usuário  
**Para** gerenciar sem sair da tabela

**Critérios de Aceitação:**
- [ ] 3 botões: Ver, Editar, Impersonate
- [ ] Permissions check em cada ação
- [ ] Modals de confirmação
- [ ] Audit log de todas as ações

**Estimativa:** 8 SP / 16h

---

### Entregáveis do Sprint 2
- [ ] Dashboard page completa
- [ ] Métricas funcionais com auto-refresh
- [ ] Activity feed com real-time
- [ ] Tabela de usuários com sorting/actions
- [ ] RPC functions otimizadas
- [ ] Testes de performance (latência p95 <500ms)

**Total Sprint 2:** 40 SP (~80h de engenharia)

---

## **SPRINT 3: USER MANAGEMENT & ANALYTICS** (2 semanas)

### Objetivos
Implementar gestão completa de usuários (CRUD, impersonation, detail page) e página de Analytics com cohorts/funnel.

### Story Points: 42

---

### **EPIC 3.1: User Management**

#### User Story 3.1.1: Users List com Filtros Avançados
**Como** admin  
**Quero** filtrar usuários por múltiplos critérios  
**Para** encontrar exatamente quem procuro

**Critérios de Aceitação:**
- [ ] Filtros: Status, Segmento, Data de criação, Household
- [ ] Search por nome/email/ID
- [ ] Filtros combinados (AND logic)
- [ ] URL sync (query params)
- [ ] Pagination (50 por página)

**Tasks Técnicos:**
```typescript
// src/admin/stores/filterStore.ts
interface FilterState {
  search: string
  status: 'all' | 'active' | 'inactive'
  segment: 'all' | 'power' | 'active' | 'casual' | 'churned'
  dateFrom: Date | null
  dateTo: Date | null
  page: number
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  status: 'all',
  segment: 'all',
  dateFrom: null,
  dateTo: null,
  page: 1,
  
  setFilter: (key, value) => set({ [key]: value, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ 
    search: '', 
    status: 'all', 
    segment: 'all', 
    dateFrom: null, 
    dateTo: null, 
    page: 1 
  }),
}))

// src/admin/hooks/useUsersList.ts
export function useUsersList() {
  const filters = useFilterStore()
  
  return useQuery({
    queryKey: ['users-list', filters],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('users')
        .select('*, households(*), transactions(count)', { count: 'exact' })
      
      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }
      
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
      }
      
      if (filters.segment !== 'all') {
        // Apply segment logic
        const segmentRanges = {
          power: { min: 50, max: Infinity },
          active: { min: 10, max: 49 },
          casual: { min: 1, max: 9 },
          churned: { min: 0, max: 0 },
        }
        
        const range = segmentRanges[filters.segment]
        query = query.gte('monthly_transaction_count', range.min)
        if (range.max !== Infinity) {
          query = query.lte('monthly_transaction_count', range.max)
        }
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString())
      }
      
      // Pagination
      const from = (filters.page - 1) * 50
      const to = from + 49
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        users: data,
        total: count,
        pages: Math.ceil((count ?? 0) / 50),
      }
    },
  })
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 3.1.2: User Detail Page (8 Tabs)
**Como** admin  
**Quero** ver informações completas do usuário organizadas em tabs  
**Para** ter uma visão 360º

**Critérios de Aceitação:**
- [ ] 8 tabs: Overview, Activity, Households, Financial, Support, Security, Danger Zone
- [ ] Timeline de atividades
- [ ] Edit inline em campos permitidos
- [ ] Modals de confirmação para ações críticas

**Tasks Técnicos:**
```typescript
// src/admin/pages/Users/UserDetail.tsx
export function UserDetailPage() {
  const { userId } = useParams()
  const { can } = usePermissions()
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          households(*),
          bank_accounts(*),
          credit_cards(*),
          transactions(*),
          user_sessions(*)
        `)
        .eq('id', userId)
        .single()
      
      return data
    },
  })
  
  return (
    <div>
      {/* Header with avatar + quick stats */}
      <UserHeader user={user} />
      
      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="households">Households</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {can('DELETE_USERS') && (
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview">
          <UserOverview user={user} />
        </TabsContent>
        
        <TabsContent value="activity">
          <UserActivityTimeline userId={userId} />
        </TabsContent>
        
        {/* ... outros tabs */}
        
        <TabsContent value="danger">
          <DangerZone user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 3.1.3: Impersonation Flow
**Como** super_admin ou admin  
**Quero** impersonar um usuário com motivo registrado  
**Para** debugar problemas reportados

**Critérios de Aceitação:**
- [ ] Modal de confirmação com campo "motivo" obrigatório
- [ ] Session tracking em `impersonation_sessions`
- [ ] Banner vermelho durante impersonation
- [ ] Timeout automático (30 min)
- [ ] Email notification ao usuário
- [ ] Audit log completo

**Tasks Técnicos:**
```typescript
// src/admin/hooks/useImpersonate.ts
export function useImpersonate() {
  const { user: admin } = useAdminAuth()
  
  const { mutate: startImpersonation } = useMutation({
    mutationFn: async ({ userId, reason }: ImpersonateParams) => {
      // 1. Create impersonation session
      const { data: session } = await supabaseAdmin
        .from('impersonation_sessions')
        .insert({
          admin_id: admin.id,
          user_id: userId,
          reason,
        })
        .select()
        .single()
      
      // 2. Generate impersonation token
      const { data: authData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
      })
      
      // 3. Log audit
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: admin.id,
        action: 'impersonate_user',
        resource_type: 'user',
        resource_id: userId,
        metadata: {
          reason,
          session_id: session.id,
        },
        result: 'success',
      })
      
      // 4. Send email notification
      await sendEmail({
        to: userEmail,
        template: 'impersonation-notification',
        data: {
          adminName: admin.name,
          reason,
          timestamp: new Date().toISOString(),
        },
      })
      
      return { token: authData.properties.action_link, sessionId: session.id }
    },
    onSuccess: ({ token }) => {
      // Open impersonation in new tab
      window.open(`${import.meta.env.VITE_APP_URL}?impersonate=${token}`, '_blank')
    },
  })
  
  return { startImpersonation }
}

// Auto-timeout após 30 min
useEffect(() => {
  if (isImpersonating) {
    const timeout = setTimeout(() => {
      endImpersonation()
    }, 30 * 60 * 1000) // 30 min
    
    return () => clearTimeout(timeout)
  }
}, [isImpersonating])
```

**Estimativa:** 13 SP / 26h

---

### **EPIC 3.2: Analytics Page**

#### User Story 3.2.1: User Segmentation Cards
**Como** PM  
**Quero** ver distribuição de usuários por segmento  
**Para** entender o engagement

**Critérios de Aceitação:**
- [ ] 4 cards: Power Users, Active, Casual, Churned
- [ ] Percentuais e números absolutos
- [ ] Click no card → filtra users list

**Estimativa:** 5 SP / 10h

---

#### User Story 3.2.2: Conversion Funnel
**Como** PM  
**Quero** ver funil de conversão do onboarding  
**Para** identificar drop-offs

**Critérios de Aceitação:**
- [ ] 7 estágios: Sign Up → ... → Active D7
- [ ] Barras proporcionais com %
- [ ] Hover mostra números absolutos

**Tasks Técnicos:**
```typescript
// src/admin/hooks/useFunnelData.ts
export function useFunnelData(dateRange: DateRange) {
  return useQuery({
    queryKey: ['funnel', dateRange],
    queryFn: async () => {
      const { data } = await supabaseAdmin.rpc('get_onboarding_funnel', {
        start_date: dateRange.from,
        end_date: dateRange.to,
      })
      
      return data
    },
  })
}

// Supabase RPC
CREATE OR REPLACE FUNCTION get_onboarding_funnel(
  start_date DATE,
  end_date DATE
)
RETURNS JSON AS $$
WITH cohort AS (
  SELECT id, email, created_at
  FROM auth.users
  WHERE created_at::DATE BETWEEN start_date AND end_date
),
stages AS (
  SELECT
    COUNT(DISTINCT c.id) AS signup,
    COUNT(DISTINCT CASE WHEN u.email_confirmed_at IS NOT NULL THEN c.id END) AS email_verified,
    COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN c.id END) AS first_login,
    COUNT(DISTINCT CASE WHEN h.id IS NOT NULL THEN c.id END) AS household_created,
    COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN c.id END) AS first_transaction,
    COUNT(DISTINCT CASE WHEN t5.user_id IS NOT NULL THEN c.id END) AS five_transactions,
    COUNT(DISTINCT CASE WHEN d7.user_id IS NOT NULL THEN c.id END) AS active_d7
  FROM cohort c
  LEFT JOIN users u ON c.id = u.id
  LEFT JOIN user_sessions s ON c.id = s.user_id AND s.created_at <= c.created_at + INTERVAL '7 days'
  LEFT JOIN households h ON c.id = h.owner_id
  LEFT JOIN transactions t ON c.id = t.user_id AND t.created_at <= c.created_at + INTERVAL '7 days'
  LEFT JOIN (
    SELECT user_id
    FROM transactions
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  ) t5 ON c.id = t5.user_id
  LEFT JOIN (
    SELECT user_id
    FROM user_sessions
    WHERE created_at <= cohort.created_at + INTERVAL '7 days'
    GROUP BY user_id
    HAVING COUNT(DISTINCT DATE(created_at)) >= 3
  ) d7 ON c.id = d7.user_id
)
SELECT json_build_object(
  'signup', signup,
  'emailVerified', email_verified,
  'firstLogin', first_login,
  'householdCreated', household_created,
  'firstTransaction', first_transaction,
  'fiveTransactions', five_transactions,
  'activeD7', active_d7
) FROM stages;
$$ LANGUAGE plpgsql;
```

**Estimativa:** 8 SP / 16h

---

### Entregáveis do Sprint 3
- [ ] Users List com filtros completos
- [ ] User Detail page com 8 tabs
- [ ] Impersonation flow funcional
- [ ] Analytics page com segmentação + funnel
- [ ] Audit log registrando tudo
- [ ] Testes E2E de impersonation

**Total Sprint 3:** 42 SP (~84h de engenharia)

---

## **SPRINT 4: TRANSACTIONS & SYSTEM HEALTH** (2 semanas)

### Objetivos
Implementar gestão de transações globais e monitoring de system health com alertas.

### Story Points: 38

---

### **EPIC 4.1: Transactions Management**

#### User Story 4.1.1: Global Transactions List
**Como** admin  
**Quero** ver todas as transações do sistema  
**Para** monitorar atividade financeira

**Critérios de Aceitação:**
- [ ] Filtros: Tipo, Status, Date range, User, Household, Value range
- [ ] Sorting por coluna
- [ ] Badges coloridos (income/expense/transfer)
- [ ] Export CSV

**Tasks Técnicos:**
```typescript
// src/admin/pages/Transactions/TransactionsList.tsx
export function TransactionsList() {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    minValue: null,
    maxValue: null,
  })
  
  const { data, isLoading } = useQuery({
    queryKey: ['transactions-list', filters],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          users(name, email),
          households(name),
          categories(name, icon)
        `, { count: 'exact' })
      
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      
      if (filters.minValue !== null) {
        query = query.gte('amount', filters.minValue)
      }
      
      if (filters.maxValue !== null) {
        query = query.lte('amount', filters.maxValue)
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(0, 99)
      
      if (error) throw error
      
      return { transactions: data, total: count }
    },
  })
  
  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      accessorKey: 'created_at',
      header: 'Data/Hora',
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm'),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'users.name',
      header: 'Usuário',
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => {
        const { amount, type } = row.original
        const formatted = formatCurrency(amount)
        const color = type === 'income' ? 'text-green-500' : 
                      type === 'expense' ? 'text-red-500' : 
                      'text-gray-400'
        
        return (
          <span className={cn('font-mono font-bold', color)}>
            {type === 'income' && '+'}
            {type === 'expense' && '-'}
            {formatted}
          </span>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <TransactionTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ], [])
  
  return (
    <div>
      <TransactionFilters filters={filters} onChange={setFilters} />
      <DataTable columns={columns} data={data?.transactions ?? []} />
    </div>
  )
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 4.1.2: Transaction Detail Modal
**Como** admin  
**Quero** ver detalhes completos de uma transação  
**Para** entender contexto e debugar

**Critérios de Aceitação:**
- [ ] Modal com todos os campos
- [ ] Edit/Delete actions (com confirmação)
- [ ] Histórico de modificações
- [ ] Link para user detail

**Estimativa:** 8 SP / 16h

---

#### User Story 4.1.3: Aggregate Stats
**Como** CFO  
**Quero** ver totais agregados (receitas, despesas, saldo)  
**Para** entender saúde financeira da plataforma

**Critérios de Aceitação:**
- [ ] 4 cards no topo: Receitas (30d), Despesas (30d), Saldo Líquido, Total Transações
- [ ] Atualização ao aplicar filtros
- [ ] Comparação com período anterior

**Estimativa:** 5 SP / 10h

---

### **EPIC 4.2: System Health Monitoring**

#### User Story 4.2.1: Service Status Cards
**Como** DevOps  
**Quero** ver status de todos os serviços  
**Para** identificar problemas rapidamente

**Critérios de Aceitação:**
- [ ] 6 service cards: API, Database (primary/replica), Edge Functions, CDN, Background Jobs
- [ ] Status visual: Healthy (green), Degraded (yellow), Error (red)
- [ ] Métricas por serviço: latency, CPU, connections, etc
- [ ] Auto-refresh a cada 15s

**Tasks Técnicos:**
```typescript
// src/admin/hooks/useSystemHealth.ts
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      // Parallel fetch de todos os health checks
      const [api, database, edgeFunctions, cdn, jobs] = await Promise.all([
        checkApiHealth(),
        checkDatabaseHealth(),
        checkEdgeFunctionsHealth(),
        checkCDNHealth(),
        checkBackgroundJobsHealth(),
      ])
      
      return {
        api,
        database,
        edgeFunctions,
        cdn,
        jobs,
        overall: calculateOverallHealth([api, database, edgeFunctions, cdn, jobs]),
      }
    },
    refetchInterval: 15000, // 15s
  })
}

async function checkApiHealth() {
  const start = Date.now()
  
  try {
    const response = await fetch(`${API_URL}/health`)
    const latency = Date.now() - start
    
    if (!response.ok) throw new Error('API unhealthy')
    
    const data = await response.json()
    
    return {
      service: 'API Server',
      status: latency < 200 ? 'healthy' : latency < 500 ? 'degraded' : 'error',
      metrics: {
        latency: `${latency}ms`,
        uptime: data.uptime,
      },
    }
  } catch (error) {
    return {
      service: 'API Server',
      status: 'error',
      metrics: {},
      error: error.message,
    }
  }
}

async function checkDatabaseHealth() {
  try {
    // Query simples para testar conexão
    const start = Date.now()
    await supabaseAdmin.from('users').select('id').limit(1).single()
    const latency = Date.now() - start
    
    // Pegar métricas de CPU/connections via admin API
    const { data: metrics } = await supabaseAdmin.rpc('get_database_metrics')
    
    return {
      service: 'Database (Primary)',
      status: metrics.cpu < 70 && latency < 100 ? 'healthy' : 
              metrics.cpu < 90 ? 'degraded' : 'error',
      metrics: {
        cpu: `${metrics.cpu}%`,
        connections: metrics.connections,
        latency: `${latency}ms`,
      },
    }
  } catch (error) {
    return {
      service: 'Database (Primary)',
      status: 'error',
      error: error.message,
    }
  }
}

// ... outros health checks
```

**Estimativa:** 13 SP / 26h

---

#### User Story 4.2.2: Performance Metrics Dashboard
**Como** SRE  
**Quero** ver métricas agregadas de performance  
**Para** identificar degradação antes de virar incidente

**Critérios de Aceitação:**
- [ ] 4 métricas: API Latency p95, Database CPU, Error Rate, Rate Limit Hits
- [ ] Targets visuais (green/yellow/red zones)
- [ ] Comparação com período anterior
- [ ] Link para logs/traces (Sentry)

**Estimativa:** 8 SP / 16h

---

#### User Story 4.2.3: Incident History
**Como** on-call engineer  
**Quero** ver histórico de incidentes  
**Para** aprender com problemas passados

**Critérios de Aceitação:**
- [ ] Timeline de últimos 30 dias
- [ ] Severidade: Critical, Major, Minor
- [ ] Duração e impacto estimado
- [ ] RCA (Root Cause Analysis) se disponível

**Estimativa:** 5 SP / 10h

---

### Entregáveis do Sprint 4
- [ ] Transactions list com filtros + export
- [ ] Transaction detail modal
- [ ] System Health page completa
- [ ] Service monitoring com auto-refresh
- [ ] Incident history
- [ ] Alertas configurados (email/Slack)

**Total Sprint 4:** 38 SP (~76h de engenharia)

---

## **SPRINT 5: FEATURE FLAGS, AUDIT LOG & POLISH** (2 semanas)

### Objetivos
Implementar Feature Flags management, Audit Log completo e fazer polish geral (testes, performance, documentação).

### Story Points: 36

---

### **EPIC 5.1: Feature Flags Management**

#### User Story 5.1.1: Feature Flags CRUD
**Como** PM  
**Quero** criar e gerenciar feature flags  
**Para** controlar rollout de features

**Critérios de Aceitação:**
- [ ] Lista de flags existentes
- [ ] Create/Edit modal
- [ ] Toggle ON/OFF com confirmação
- [ ] Rollout slider (0-100%)
- [ ] Target segments (power_users, beta_testers, etc)

**Tasks Técnicos:**
```typescript
// src/admin/pages/FeatureFlags/FeatureFlagsList.tsx
export function FeatureFlagsList() {
  const { data: flags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .order('name')
      
      return data
    },
  })
  
  const { mutate: toggleFlag } = useMutation({
    mutationFn: async ({ id, isEnabled }: ToggleFlagParams) => {
      const { error } = await supabaseAdmin
        .from('feature_flags')
        .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      // Log audit
      await logAuditEvent({
        action: 'toggle_feature_flag',
        resource_type: 'feature_flag',
        resource_id: id,
        metadata: { is_enabled: isEnabled },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      toast.success('Feature flag atualizada')
    },
  })
  
  return (
    <div className="grid gap-4">
      {flags?.map((flag) => (
        <FeatureFlagCard
          key={flag.id}
          flag={flag}
          onToggle={(isEnabled) => toggleFlag({ id: flag.id, isEnabled })}
          onUpdateRollout={(percentage) => updateRollout({ id: flag.id, percentage })}
        />
      ))}
    </div>
  )
}

// src/admin/components/FeatureFlags/FeatureFlagCard.tsx
export function FeatureFlagCard({ flag, onToggle, onUpdateRollout }: Props) {
  const [rollout, setRollout] = useState(flag.rollout_percentage)
  const { can } = usePermissions()
  
  return (
    <div className="bg-admin-secondary border rounded-2xl p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">{flag.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{flag.description}</p>
          
          <div className="flex gap-4 text-xs text-gray-500 font-mono">
            <span>Criado em: {format(flag.created_at, 'dd/MM/yyyy')}</span>
            <span>Por: {flag.created_by}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Rollout Slider */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl font-bold font-mono">
              {rollout}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={rollout}
              onChange={(e) => setRollout(Number(e.target.value))}
              onMouseUp={() => onUpdateRollout(rollout)}
              className="w-48"
              disabled={!can('MANAGE_FEATURE_FLAGS')}
            />
          </div>
          
          {/* Toggle Switch */}
          <Switch
            checked={flag.is_enabled}
            onCheckedChange={onToggle}
            disabled={!can('MANAGE_FEATURE_FLAGS')}
          />
        </div>
      </div>
      
      {flag.target_segment && (
        <Badge variant="outline" className="mt-4">
          Target: {flag.target_segment}
        </Badge>
      )}
    </div>
  )
}
```

**Estimativa:** 13 SP / 26h

---

#### User Story 5.1.2: A/B Testing Configuration
**Como** PM  
**Quero** configurar A/B tests com flags  
**Para** validar hipóteses de produto

**Critérios de Aceitação:**
- [ ] Split 50/50 ou custom %
- [ ] Target específico (user IDs, emails, segments)
- [ ] Tracking de conversão integrado

**Estimativa:** 8 SP / 16h

---

### **EPIC 5.2: Audit Log**

#### User Story 5.2.1: Comprehensive Audit Log
**Como** compliance officer  
**Quero** ver todas as ações sensíveis de admins  
**Para** garantir accountability

**Critérios de Aceitação:**
- [ ] Timeline completa de ações
- [ ] Filtros: Admin, Action type, Date range, Resource
- [ ] Export CSV para compliance
- [ ] Retention policy (90 dias)

**Tasks Técnicos:**
```typescript
// src/admin/pages/AuditLog/AuditLog.tsx
export function AuditLog() {
  const [filters, setFilters] = useState({
    adminId: null,
    action: 'all',
    dateFrom: subDays(new Date(), 7),
    dateTo: new Date(),
  })
  
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          admin_users(name, email)
        `)
        .order('timestamp', { ascending: false })
      
      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId)
      }
      
      if (filters.action !== 'all') {
        query = query.eq('action', filters.action)
      }
      
      query = query
        .gte('timestamp', filters.dateFrom.toISOString())
        .lte('timestamp', filters.dateTo.toISOString())
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      return data
    },
  })
  
  const { mutate: exportCSV } = useMutation({
    mutationFn: async () => {
      // Export completo sem limit
      const { data } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('timestamp', filters.dateFrom.toISOString())
        .lte('timestamp', filters.dateTo.toISOString())
        .csv()
      
      return data
    },
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
    },
  })
  
  return (
    <div>
      <AuditLogFilters filters={filters} onChange={setFilters} />
      
      <Button onClick={() => exportCSV()} variant="outline">
        Exportar CSV
      </Button>
      
      <div className="mt-8">
        <AuditLogTimeline events={data ?? []} />
      </div>
    </div>
  )
}

// src/admin/components/AuditLog/AuditLogTimeline.tsx
export function AuditLogTimeline({ events }: { events: AuditLogEvent[] }) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700" />
      
      {events.map((event) => (
        <AuditLogItem key={event.id} event={event} />
      ))}
    </div>
  )
}

export function AuditLogItem({ event }: { event: AuditLogEvent }) {
  const severityColor = {
    impersonate: 'text-red-500',
    delete: 'text-orange-500',
    modify: 'text-yellow-500',
    view: 'text-blue-500',
    config: 'text-green-500',
  }[event.action] ?? 'text-gray-500'
  
  return (
    <div className="relative mb-8 bg-admin-secondary border rounded-xl p-6 ml-8">
      {/* Dot on timeline */}
      <div className={cn(
        "absolute -left-11 top-6 w-3 h-3 rounded-full border-2 border-admin-primary",
        severityColor
      )} />
      
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-lg">
          {getActionTitle(event.action)}
        </h4>
        <Badge variant={getSeverityVariant(event.action)}>
          {event.action}
        </Badge>
      </div>
      
      <p className="text-gray-400 mb-4">
        <strong>{event.admin_users.name}</strong> {getActionDescription(event)}
      </p>
      
      <div className="flex gap-6 text-xs text-gray-500 font-mono">
        <span>📅 {format(event.timestamp, "dd/MM/yyyy 'às' HH:mm:ss")}</span>
        <span>🌐 IP: {event.ip_address}</span>
        <span>🆔 {event.resource_type}/{event.resource_id}</span>
        <span className={event.result === 'success' ? 'text-green-500' : 'text-red-500'}>
          {event.result === 'success' ? '✓ Sucesso' : '✗ Falhou'}
        </span>
      </div>
      
      {event.error_message && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{event.error_message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

**Estimativa:** 13 SP / 26h

---

### **EPIC 5.3: Polish & Quality**

#### User Story 5.3.1: E2E Tests (Playwright)
**Como** QA engineer  
**Quero** testes E2E cobrindo fluxos críticos  
**Para** garantir que nada quebra em produção

**Critérios de Aceitação:**
- [ ] 15+ testes E2E
- [ ] Fluxos cobertos: Auth, User CRUD, Impersonation, Feature Flags, Audit Log
- [ ] CI/CD executando testes automaticamente
- [ ] Reports de cobertura

**Tasks Técnicos:**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    
    await page.fill('input[name="email"]', 'admin@versix.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/admin/dashboard')
    
    // Should show admin name in header
    await expect(page.locator('[data-testid="admin-name"]')).toHaveText('Ângelo Versix')
  })
  
  test('should require 2FA for super_admin', async ({ page }) => {
    // ... test 2FA flow
  })
  
  test('should block unauthorized access', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/admin/login')
  })
})

// tests/e2e/users.spec.ts
test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await login(page, 'admin@versix.com', 'password')
  })
  
  test('should list users with filters', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Should show users table
    await expect(page.locator('table')).toBeVisible()
    
    // Apply filter
    await page.selectOption('select[name="status"]', 'active')
    
    // Should filter results
    await expect(page.locator('table tbody tr')).toHaveCount(10)
  })
  
  test('should navigate to user detail', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Click first user
    await page.click('table tbody tr:first-child')
    
    // Should show user detail
    await expect(page).toHaveURL(/\/admin\/users\/.+/)
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible()
  })
  
  test('should impersonate user', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Click impersonate button
    await page.click('button[title="Impersonate"]')
    
    // Should show modal
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Fill reason
    await page.fill('textarea[name="reason"]', 'Debug reported issue')
    
    // Confirm
    await page.click('button:has-text("Confirmar")')
    
    // Should open new tab (check audit log)
    // ...
  })
})

// tests/e2e/audit-log.spec.ts
test.describe('Audit Log', () => {
  test('should log all admin actions', async ({ page }) => {
    await login(page, 'admin@versix.com', 'password')
    
    // Perform action
    await page.goto('/admin/users/123')
    await page.click('button:has-text("Reset Password")')
    await page.click('button:has-text("Confirmar")')
    
    // Check audit log
    await page.goto('/admin/audit-log')
    
    // Should show logged action
    await expect(page.locator('text=Reset de Senha')).toBeVisible()
  })
})
```

**Estimativa:** 8 SP / 16h

---

#### User Story 5.3.2: Performance Optimization
**Como** tech lead  
**Quero** otimizar performance de queries lentas  
**Para** manter latência <500ms p95

**Critérios de Aceitação:**
- [ ] Identify slow queries (>500ms)
- [ ] Add database indexes
- [ ] Implement caching (React Query)
- [ ] Code splitting (lazy loading)
- [ ] Lighthouse score >90

**Tasks:**
- [ ] Analyze slow queries com `EXPLAIN ANALYZE`
- [ ] Criar indexes necessários
- [ ] Implementar virtual scrolling nas tabelas grandes
- [ ] Lazy load páginas com `React.lazy()`
- [ ] Otimizar bundle size (<500KB gzipped)

**Estimativa:** 5 SP / 10h

---

#### User Story 5.3.3: Documentation
**Como** novo dev no time  
**Quero** documentação completa  
**Para** conseguir contribuir rapidamente

**Critérios de Aceitação:**
- [ ] README.md com setup instructions
- [ ] Architecture Decision Records (ADRs)
- [ ] API documentation (RPCs + Edge Functions)
- [ ] Runbook operacional
- [ ] Video walkthrough (Loom)

**Tasks:**
```markdown
# docs/README.md

## Admin Dashboard - Finansix

### Quick Start

1. Clone repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Run dev server: `npm run dev`

### Architecture

- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Edge Functions)
- State: Zustand + TanStack Query
- UI: TailwindCSS + Shadcn/UI

### Folder Structure

src/admin/
├── components/  # Reusable components
├── pages/       # Page components
├── hooks/       # Custom hooks
├── lib/         # Utilities
└── stores/      # Zustand stores

### Key Concepts

#### RBAC (Role-Based Access Control)

4 roles: super_admin, admin, support, analyst

Use `usePermissions()` hook:

```typescript
const { can } = usePermissions()

if (can('DELETE_USERS')) {
  // Show delete button
}
```

#### Audit Logging

All sensitive actions are logged automatically via `logAuditEvent()`:

```typescript
await logAuditEvent({
  action: 'impersonate_user',
  resource_type: 'user',
  resource_id: userId,
  metadata: { reason },
})
```

### Testing

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Coverage: `npm run test:coverage`

### Deployment

CI/CD via GitHub Actions:
- PR: Runs tests + build
- Merge to main: Deploys to production (Vercel)

### Troubleshooting

**Issue:** Can't login
**Solution:** Check if admin_users table has your email

**Issue:** Slow queries
**Solution:** Check indexes, use `EXPLAIN ANALYZE`
```

**Estimativa:** 3 SP / 6h

---

### Entregáveis do Sprint 5
- [ ] Feature Flags management completo
- [ ] Audit Log com export CSV
- [ ] 15+ testes E2E passando
- [ ] Performance otimizada (p95 <500ms)
- [ ] Documentação completa
- [ ] Training session gravado

**Total Sprint 5:** 36 SP (~72h de engenharia)

---

## 📦 ENTREGÁVEIS FINAIS

### Código
- [ ] Repositório GitHub com código completo
- [ ] CI/CD configurado (GitHub Actions)
- [ ] Testes automatizados (>80% coverage)
- [ ] Linter + Prettier configurados
- [ ] Pre-commit hooks (Husky)

### Documentação
- [ ] README.md completo
- [ ] Architecture Decision Records (ADRs)
- [ ] API documentation
- [ ] Runbook operacional
- [ ] Video walkthrough (10-15 min)
- [ ] Training deck para admins

### Infraestrutura
- [ ] Ambiente de produção configurado
- [ ] Monitoring + alertas configurados (Sentry, Uptime)
- [ ] Backup strategy implementada
- [ ] Disaster recovery plan documentado

### Compliance & Security
- [ ] Security review completo
- [ ] RBAC testado e validado
- [ ] Audit log 100% funcional
- [ ] Data retention policies implementadas
- [ ] LGPD compliance checklist preenchida

---

## 🎯 RISCOS E MITIGAÇÕES

### Risco 1: Scope Creep (Probabilidade: ALTA)
**Impacto:** Atraso de 2-4 semanas

**Mitigação:**
- Definition of Done clara por sprint
- PM fazendo gate-keeping de novas features
- Buffer de 1-2 semanas no final

### Risco 2: Dependência de Supabase (Probabilidade: MÉDIA)
**Impacto:** Bloqueio de 1-2 dias se houver outage

**Mitigação:**
- Monitorar status.supabase.com
- Ter plano B para RLS (lógica no backend se necessário)
- Implementar retry logic + circuit breakers

### Risco 3: Performance em Produção (Probabilidade: MÉDIA)
**Impacto:** User experience degradada

**Mitigação:**
- Load testing antes do lançamento (k6/Artillery)
- Profiling com React DevTools
- Database indexes bem planejados
- CDN para assets estáticos

### Risco 4: Bugs Críticos pós-lançamento (Probabilidade: MÉDIA)
**Impacto:** Perda de confiança dos admins

**Mitigação:**
- Beta testing interno (1 semana)
- Feature flags para kill switch
- Rollback strategy documentada
- On-call rotation definida

### Risco 5: Falta de Recursos (Probabilidade: BAIXA)
**Impacto:** Atraso de 2-4 semanas

**Mitigação:**
- Buffer de 1-2 semanas
- Priorizar features críticas (MVP first)
- Contratar freelancer se necessário

---

## 📊 MÉTRICAS DE ACOMPANHAMENTO

### Sprint Metrics (acompanhar semanalmente)
- **Velocity:** Story points completados por sprint
- **Burn-down chart:** Progresso vs planejado
- **Bug count:** Bugs abertos/fechados
- **Test coverage:** % de cobertura de testes
- **Build time:** Tempo de CI/CD

### Quality Metrics (acompanhar diariamente)
- **Lighthouse Score:** >90
- **Error Rate (Sentry):** <0.5%
- **API Latency p95:** <500ms
- **Database CPU:** <70%
- **Deployment success rate:** >95%

### Business Metrics (pós-lançamento)
- **Admin adoption:** 100% em 2 semanas
- **Support resolution time:** <10 min (vs 30 min antes)
- **Time to detect incidents:** <5 min
- **Admin satisfaction (NPS):** >8/10

---

## 🚀 ESTRATÉGIA DE LANÇAMENTO

### Fase 1: Internal Beta (1 semana)
- **Participantes:** 2-3 super admins internos
- **Objetivo:** Validar funcionalidades críticas
- **Critérios de sucesso:** Zero bugs P0/P1

### Fase 2: Limited Beta (1 semana)
- **Participantes:** Todos os admins/support (5-8 pessoas)
- **Objetivo:** Validar usabilidade e workflows
- **Critérios de sucesso:** NPS >7, <5 bugs P2

### Fase 3: General Availability
- **Participantes:** Todos os admins
- **Comunicação:** Email + training session
- **Suporte:** Canal dedicado no Slack + runbook

### Rollback Plan
Se houver bugs críticos:
1. Feature flag para desabilitar funcionalidade problemática
2. Rollback para versão anterior (via Vercel)
3. Comunicação imediata via Slack
4. Post-mortem em 24h

---

## 💰 INVESTIMENTO TOTAL

### Recursos Humanos (10 semanas)
| Role | Dedicação | Horas | Taxa (R$/h) | Total (R$) |
|------|-----------|-------|-------------|------------|
| Tech Lead | 100% | 400h | R$ 250 | R$ 100.000 |
| Frontend Engineer Sr (2x) | 100% | 800h | R$ 200 | R$ 160.000 |
| Backend Engineer Sr | 50% | 200h | R$ 200 | R$ 40.000 |
| DevOps/SRE | 30% | 120h | R$ 180 | R$ 21.600 |
| Product Manager | 25% | 100h | R$ 150 | R$ 15.000 |
| Designer | 25% | 100h | R$ 150 | R$ 15.000 |
| **TOTAL ENGENHARIA** | | **1,720h** | | **R$ 351.600** |

### Ferramentas & Infraestrutura (anual)
| Item | Custo Mensal | Custo Anual |
|------|--------------|-------------|
| Supabase Pro | R$ 125 | R$ 1.500 |
| Vercel Pro | R$ 100 | R$ 1.200 |
| Sentry Business | R$ 400 | R$ 4.800 |
| PostHog Scale | R$ 200 | R$ 2.400 |
| GitHub Team | R$ 200 | R$ 2.400 |
| **TOTAL INFRA** | **R$ 1.025** | **R$ 12.300** |

### **INVESTIMENTO TOTAL: R$ 363.900** (primeira implantação)
### **Custo Operacional: R$ 1.025/mês** (infra)

---

## 📞 PRÓXIMOS PASSOS

1. **Aprovar Plano:** Stakeholders review + sign-off (2 dias)
2. **Montar Time:** Contratar/alocar recursos (1 semana)
3. **Kickoff Meeting:** Alinhar time + objetivos (1 dia)
4. **Sprint 0:** Setup infra + scaffolding (1 semana)
5. **Start Sprint 1:** 🚀

---

## 📝 APROVAÇÕES

| Stakeholder | Cargo | Status | Data |
|-------------|-------|--------|------|
| Ângelo Versix | Tech Lead | ⏳ Pendente | - |
| [Nome] | CTO | ⏳ Pendente | - |
| [Nome] | Product Manager | ⏳ Pendente | - |
| [Nome] | CFO | ⏳ Pendente | - |

---

**Preparado por:** Versix Team Developers  
**Data:** 17 Janeiro 2026  
**Versão:** 1.0  
**Status:** 📋 Aguardando Aprovação
