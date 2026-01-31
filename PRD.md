# Product Requirement Document (PRD) - Finansix

## 1. Introduction

**Finansix** is a mobile-first Personal Finance Management (PFM) Progressive Web App (PWA) designed for individuals and families. It focuses on credit card management, installment tracking, and "Free Balance" calculation.

## 2. Core Value Proposition

- **Real-time "Free Balance"**: Calculates available spending money by deducting future commitments from the current balance.
- **Card Optimization**: Recommends the best credit card for a purchase based on closing dates and limits.
- **Installment Projection ("Explosion")**: Automatically projects future installments from credit card purchases.
- **Multi-tenancy**: Supports multiple users within a household sharing data.

## 3. Technology Stack

- **Frontend**: React 18, TypeScript 5, Vite, TailwindCSS, TanStack Query, Zustand, Framer Motion.
- **Backend**: Supabase (PostgreSQL, Auth/GoTrue, Edge Functions, Realtime, Storage).
- **Deployment**: Vercel (Frontend), Supabase (Backend).

## 4. Key Features & User Stories

### 4.1. Financial Dashboard

- **Feature**: Overview of current balance, free balance, and monthly spending.
- **Requirement**: Display "Saldo Livre" prominently.
- **Requirement**: Show "Relief Chart" (future financial relief projection).

### 4.2. Transaction Management

- **Feature**: Add, edit, and categorize transactions (income/expense).
- **Requirement**: Support for recurring transactions and installments.
- **Requirement**: "Installment Explosion" logic must correctly allocate values to future months.

### 4.3. Bill & Invoice Payment System

- **Feature**: Track and pay bills and credit card invoices.
- **Status Workflow**:
  - `Pending` (Yellow): Open bill.
  - `Paid` (Green): Bill paid.
  - `Overdue` (Red): Date passed without payment.
  - `Partial` (Blue): Partial payment made.
- **Invoice Payments**: Support Total, Partial, and Minimum payments.

### 4.4. Accounts Management

- **Feature**: Manage bank accounts and credit cards.
- **Requirement**: Account details page with transaction history.
- **Requirement**: Auto-fill bank data integration.

### 4.5. Offline Support (PWA)

- **Feature**: Full functionality when offline (read/write with sync).
- **Requirement**: Service Worker configuration for caching.

## 5. Security Requirements

- **Authentication**: Usage of Supabase Auth (JWT).
- **Authorization**: Row Level Security (RLS) policies to ensure users only see their (or their household's) data.

## 6. Acceptance Criteria

- User can log in and view their dashboard.
- "Saldo Livre" updates immediately after adding a transaction.
- Credit card invoices reflect accurate installment sums.
- Bill status transitions correctly (Pending -> Paid).
- Application loads and functions offline.
