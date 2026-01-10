# Finansix

> Sistema de gestão financeira pessoal e familiar com foco em controle de cartões de crédito e parcelamentos.

![Version](https://img.shields.io/badge/version-1.5.2.2-blue.svg)
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

### v1.5.2.2 (Atual)

- ✅ **Bottom Nav Hide on Scroll**: Menu inferior oculta ao rolar para baixo, reaparece ao rolar para cima
- ✅ **Bug Fix**: Correção do erro 404 em `transactions_with_installments_expanded`
- ✅ **Bug Fix**: Correção do erro 400 ao criar nova conta bancária

### v1.5.1.0 (Quick Wins UX)

- ✅ **Onboarding Tour Interativo**: Tour guiado para novos usuários com react-joyride
- ✅ **Animações Framer Motion**: Transições suaves entre páginas
- ✅ **Shimmer Effects**: Efeito brilho em skeletons de carregamento
- ✅ **Smart Suggestions (Base)**: Sistema de sugestões inteligentes para categorias

### v1.5.0.x (Fundação)

- ✅ **CRUD Completo**: Transações, Cartões, Contas, Categorias, Assinaturas
- ✅ **Sistema de Household**: Gestão familiar com convites e papéis
- ✅ **PWA**: Instalável com suporte offline
- ✅ **Design System**: Componentes padronizados e responsivos

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

| Feature | Descrição | Status |
|---------|-----------|--------|
| Saldo Livre | Cálculo real-time do saldo disponível | ✅ |
| Card Optimizer | Recomendação inteligente de cartões | ✅ |
| Relief Chart | Visualização de alívio financeiro futuro | ✅ |
| Multi-household | Suporte a múltiplas famílias | ✅ |
| Installment Explosion | Projeção automática de parcelas | ✅ |
| Reimbursements | Controle de valores a receber | ✅ |
| PWA | Instalável com suporte offline | ✅ |
| Onboarding Tour | Tour guiado para novos usuários | ✅ |
| Page Transitions | Animações suaves com Framer Motion | ✅ |
| Bottom Nav Auto-hide | Menu oculta/aparece baseado no scroll | ✅ |

### UX Features

| Feature | Descrição | Status |
|---------|-----------|--------|
| Smart Suggestions | Sugestões inteligentes de categorias | 🔄 Base |
| Shimmer Loading | Efeito shimmer em skeletons | ✅ |
| Pull to Refresh | Atualização por gesto | 🔜 v1.6 |
| Haptic Feedback | Vibração em ações | 🔜 v1.7 |

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
- **react-joyride** - Onboarding Tours
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

# Start development server
pnpm dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📜 Scripts Disponíveis

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run tests
```

## 📁 Estrutura do Projeto

```
finansix-web/
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── src/
│   ├── components/
│   │   ├── ui/           # Base UI components (Button, Input, Card...)
│   │   ├── features/     # Feature components (BalanceHero, TransactionItem...)
│   │   └── layout/       # Layout components (BottomNav, Header...)
│   ├── hooks/            # Custom React hooks
│   │   ├── useTransactions.ts
│   │   ├── useAccounts.ts
│   │   ├── useScrollDirection.ts  # NEW: Scroll direction detection
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/     # Supabase client & queries
│   │   ├── utils/        # Utility functions
│   │   └── presets/      # Bank presets, categories, etc.
│   ├── pages/            # Page components
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── styles/           # Global styles
├── supabase/
│   └── migrations/       # Database migrations
└── package.json
```

## 🗺 Roadmap

### v1.5.2.x (Atual) - Bug Fixes & Polish
- [x] Bottom Nav hide on scroll
- [x] Fix transactions query
- [x] Fix account creation

### v1.6.0 - Testing & Dashboard
- [ ] Test coverage 40%+
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

**Finansix v1.5.2.2** | Built with ❤️ by Versix Team
