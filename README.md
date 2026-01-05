# Finansix

> Sistema de gestão financeira pessoal e familiar com foco em controle de cartões de crédito e parcelamentos.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)
![CI](https://github.com/versix/finansix-web/workflows/CI/badge.svg)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Tech Stack](#-tech-stack)
- [Setup](#-setup)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Database Schema](#-database-schema)
- [Testes](#-testes)
- [CI/CD](#-cicd)

## 🎯 Visão Geral

Finansix é uma aplicação PWA mobile-first para gestão financeira pessoal e familiar, com foco especial em:

- **Saldo Livre Disponível**: Cálculo inteligente que desconta compromissos futuros
- **Otimização de Cartões**: Recomendação do melhor cartão para cada compra
- **Explosão de Parcelas**: Projeção automática de parcelamentos nos meses futuros
- **Multi-tenancy**: Suporte a famílias (households) com múltiplos membros

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (PWA)                        │
│  React 18 + TypeScript + Vite + TailwindCSS + TanStack Query│
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
| Error Tracking | Integração com Sentry | ✅ |

## 🛠 Tech Stack

### Frontend
- **React 18.3** - UI Framework
- **TypeScript 5.6** - Type Safety
- **Vite 5** - Build Tool
- **TailwindCSS 3.4** - Styling
- **TanStack Query 5** - Server State
- **Zustand** - Client State
- **React Router 6** - Routing
- **React Hook Form + Zod** - Forms
- **date-fns** - Date Manipulation
- **Lucide React** - Icons
- **Sentry** - Error Tracking

### Backend (Supabase)
- **PostgreSQL 15** - Database
- **Row Level Security** - Multi-tenancy
- **Edge Functions** - Serverless
- **Realtime** - WebSocket subscriptions
- **GoTrue** - Authentication

## 🚀 Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI
- Docker (para Supabase local)

### Installation

```bash
# Clone repository
git clone https://github.com/versix/finansix-web.git
cd finansix-web

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start Supabase locally (optional)
pnpm supabase start

# Run database migrations
pnpm supabase db push

# Generate types from database
pnpm db:types

# Start development server
pnpm dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=your-sentry-dsn (optional)
```

## 📜 Scripts Disponíveis

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm db:types     # Generate Supabase types
```

## 📁 Estrutura do Projeto

```
finansix-web/
├── .github/
│   └── workflows/        # CI/CD pipelines
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── src/
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   ├── features/     # Feature components
│   │   └── layout/       # Layout components
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── supabase/     # Supabase client & queries
│   │   └── utils/        # Utility functions
│   ├── pages/            # Page components
│   ├── stores/           # Zustand stores
│   ├── test/             # Test utilities
│   ├── types/            # TypeScript types
│   └── styles/           # Global styles
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions
└── package.json
```

## 🗄 Database Schema

### Core Tables

```sql
households          -- Multi-tenant root (families)
household_members   -- User-household relationships
accounts            -- Bank accounts
credit_cards        -- Credit cards with billing info
categories          -- Transaction categories
transactions        -- All financial movements
installments        -- Exploded installment records
credit_card_statements -- Monthly card statements
expected_transactions  -- Recurring income/expenses
```

## 🧪 Testes

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test calculations.test.ts
```

### Test Structure

- `src/**/*.test.ts` - Unit tests
- `src/test/setup.ts` - Test setup and mocks
- `src/test/utils.tsx` - Test utilities with providers

## 🔄 CI/CD

O projeto usa GitHub Actions para CI/CD:

1. **Lint & Type Check** - ESLint + TypeScript
2. **Unit Tests** - Vitest com coverage
3. **Build** - Verificação de build
4. **Deploy Preview** - Deploy automático para PRs
5. **Deploy Production** - Deploy para main

### Required Secrets

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
CODECOV_TOKEN (optional)
```

## 🔐 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication
- Secure household isolation
- Input validation with Zod
- Error boundaries prevent crashes

## 📄 License

MIT © Versix Solutions

---

Built with ❤️ by Versix Team
