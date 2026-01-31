# Finansix

> Sistema de gestão financeira pessoal e familiar com foco em controle de cartões de crédito e parcelamentos.

![Version](https://img.shields.io/badge/version-1.5.9.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)
![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Novidades](#-novidades)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Tech Stack](#-tech-stack)
- [Setup](#-setup)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Roadmap](#-roadmap)

## 🎯 Visão Geral

Finansix é uma aplicação PWA mobile-first para gestão financeira pessoal e familiar, com foco especial em:

- **Saldo Livre Disponível**: Cálculo inteligente que desconta compromissos futuros
- **Otimização de Cartões**: Recomendação do melhor cartão para cada compra
- **Explosão de Parcelas**: Projeção automática de parcelamentos nos meses futuros
- **Multi-tenancy**: Suporte a famílias (households) com múltiplos membros

## ✨ Novidades

### v1.5.9.0 (Stability & CI)

- 🔧 **CI/CD Fixes**: Correção no pipeline de testes (Invoice Parser) com polyfills robustos para ambiente Node.js.
- 🧹 **Code Quality**: Resolução de erros de lint e tipagem em testes de integração com `pdfjs-dist`.

### v1.5.7.0 (Production Ready)

- ⚡ **Performance**: Refatoração completa da tela de Transações, Code Splitting e Otimização de Bundle.
- 🗑️ **Bulk Delete**: Seleção múltipla e exclusão em lote de transações.
- 📱 **PWA Completo**: Configuração de Service Worker e Manifesto para instalabilidade e suporte offline.
- 🛡️ **Segurança & Qualidade**: Cobertura de testes unitários (Hooks) e E2E (Fluxos críticos), sem erros de lint.
- 🔧 **Architecture**: Melhoria na organização de código e correção de dívidas técnicas.

### v1.5.4.6 (Anterior)

- 🐛 **Hotfix**: Correção da exibição de parcelas retroativas (parcelas passadas não aparecem mais na fatura atual)
- ✅ **Bill Payment System**: Sistema de pagamento/baixa de contas (Em Aberto, Pago, Vencido)
- ✅ **Invoice Payment**: Pagamento de fatura de cartão (Total, Parcial, Mínimo)
- ✅ **Overdue Tracking**: Identificação automática de contas vencidas
- ✅ **PaymentDialog**: Novo componente para confirmação de pagamentos

### v1.5.2.x (Anteriores)

- ✅ **Account Detail Page**: Página de detalhes da conta bancária
- ✅ **Header Avatar**: Avatar do usuário logado no header
- ✅ **Auto-fill Bank Data**: Preenchimento automático de dados bancários
- ✅ **Bottom Nav Hide on Scroll**: Menu oculta ao rolar para baixo
- ✅ **Bug Fixes**: Correções de erros 404/400

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (PWA)                        │
│  React 18 + TypeScript + Vite + TailwindCSS + TanStack Query│
│  + Framer Motion + Zustand + React Hook Form                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │  Database   │  │   Edge Functions    │  │
│  │  (GoTrue)   │  │ (PostgreSQL)│  │   (Deno Runtime)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Storage    │  │  Realtime   │  │   Row Level Sec.    │  │
│  │  (S3-like)  │  │ (WebSockets)│  │      (RLS)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Funcionalidades

### Core Features

| Feature               | Descrição                                | Status     |
| --------------------- | ---------------------------------------- | ---------- |
| Saldo Livre           | Cálculo real-time do saldo disponível    | ✅         |
| Card Optimizer        | Recomendação inteligente de cartões      | ✅         |
| Relief Chart          | Visualização de alívio financeiro futuro | ✅         |
| Multi-household       | Suporte a múltiplas famílias             | ✅         |
| Installment Explosion | Projeção automática de parcelas          | ✅         |
| Bill Payment          | Pagamento/baixa de contas a pagar        | ✅ **NEW** |
| Invoice Payment       | Pagamento de fatura de cartão            | ✅ **NEW** |
| Overdue Tracking      | Identificação de contas vencidas         | ✅ **NEW** |
| PWA                   | Instalável com suporte offline           | ✅         |

### Bill Status System

| Status    | Descrição         | Cor         |
| --------- | ----------------- | ----------- |
| `pending` | Conta em aberto   | 🟡 Amarelo  |
| `paid`    | Conta paga        | 🟢 Verde    |
| `overdue` | Conta vencida     | 🔴 Vermelho |
| `partial` | Pagamento parcial | 🔵 Azul     |

### Invoice Payment Types

| Tipo        | Descrição                 |
| ----------- | ------------------------- |
| **Total**   | Paga toda a fatura        |
| **Parcial** | Paga parte da fatura      |
| **Mínimo**  | Paga o valor mínimo (15%) |

## 🛠 Tech Stack

### Frontend

- **React 18.3** - UI Framework
- **TypeScript 5.6** - Type Safety
- **Vite 5** - Build Tool
- **TailwindCSS 3.4** - Styling
- **TanStack Query 5** - Server State
- **Zustand** - Client State
- **Framer Motion 11** - Animations
- **React Router 6** - Routing
- **React Hook Form + Zod** - Forms
- **date-fns** - Date Manipulation
- **Lucide React** - Icons

### Backend (Supabase)

- **PostgreSQL 15** - Database
- **Row Level Security** - Multi-tenancy
- **Edge Functions** - Serverless
- **Realtime** - WebSocket subscriptions
- **GoTrue** - Authentication

## 🚀 Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/aissantos/finansix-web.git
cd finansix-web

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (IMPORTANT for v1.5.4.6)
pnpm supabase db push

# Start development server
pnpm dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Windows Users (PowerShell):**
> Se criar o arquivo `.env.local` via PowerShell (`echo "..." > .env.local`), certifique-se de que a codificação seja **UTF-8** ou **ASCII**. O PowerShell por padrão pode criar arquivos em UTF-16, que o Vite não consegue ler corretamente.
>
> Comando recomendado:
>
> ```powershell
> Set-Content .env.local "VITE_SUPABASE_URL=..." -Encoding Utf8
> ```

### Database Types

Para manter o TypeScript sincronizado com o banco de dados:

1. Login na CLI (primeira vez):

```bash
pnpm supabase login
```

2. Vincular projeto:

```bash
pnpm supabase link --project-ref <project-id>
```

3. Gerar tipos:

```bash
pnpm supabase gen types typescript --project-id <project-id> > src/types/database.remote.ts
```

## 📜 Scripts Disponíveis

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run tests
pnpm test         # Run tests
pnpm supabase db push  # Apply migrations
pnpm typegen      # Generate types from Supabase (requires project-id configured)
```

## 📁 Estrutura do Projeto

```
finansix-web/
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── src/
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   ├── features/
│   │   │   ├── PaymentDialog.tsx  # NEW: Payment confirmation
│   │   │   └── ...
│   │   └── layout/       # Layout components
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── supabase/     # Supabase client & queries
│   │   └── utils/        # Utility functions
│   ├── pages/
│   │   └── wallet/
│   │       ├── CardDetailPage.tsx  # Updated with payment
│   │       └── ...
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 20260110200000_bill_payment_status.sql  # NEW
│       └── ...
└── package.json
```

## 🗺 Roadmap

### v1.5.4.x (Atual) - Bill Payments

- [x] Hotfix parcelas retroativas
- [x] Sistema de pagamento de contas
- [x] Pagamento de fatura de cartão
- [x] Status de contas vencidas

### v1.6.0 - Testing & Dashboard

- [x] Test coverage 40%+ (Hooks & E2E Critical Flows)
- [ ] Dashboard widgets configuráveis
- [ ] Category Insights
- [ ] Spending Alerts

### v1.7.0 - Open Finance MVP

- [ ] Integração Pluggy
- [ ] Sincronização de transações
- [ ] Haptic feedback
- [ ] Pull-to-refresh

## 🔐 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication
- Secure household isolation
- Input validation with Zod

## 📄 License

MIT © Versix Solutions

---

**Finansix v1.5.9.0** | Built with ❤️ by Versix Team
