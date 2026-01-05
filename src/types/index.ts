// Import types from database first to avoid circular dependencies
import type {
  AccountType,
  Transaction,
  Category,
  CreditCard,
  Account,
  Installment,
} from './database';

// Re-export all database types
export * from './database';

// App-specific types

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  household_id?: string;
}

export interface FreeBalanceResult {
  currentBalance: number;
  pendingExpenses: number;
  creditCardDue: number;
  expectedIncome: number;
  expectedExpenses: number;
  pendingReimbursements: number;
  freeBalance: number;
  breakdown: BalanceBreakdownItem[];
}

export interface BalanceBreakdownItem {
  label: string;
  value: number;
  type: 'positive' | 'negative';
}

export interface CardRecommendation {
  cardId: string;
  cardName: string;
  daysUntilPayment: number;
  closingDate: Date;
  dueDate: Date;
  availableLimit: number;
  reason: string;
}

export interface MonthlyProjection {
  month: Date;
  totalInstallments: number;
  byCard: CardProjection[];
}

export interface CardProjection {
  cardId: string;
  cardName: string;
  amount: number;
  color?: string;
}

export interface TransactionWithDetails extends Transaction {
  category?: Category;
  credit_card?: CreditCard;
  account?: Account;
  installments?: Installment[];
}

export interface CreditCardWithLimits extends CreditCard {
  available_limit: number;
  used_limit: number;
}

// Form types
export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id?: string;
  account_id?: string;
  credit_card_id?: string;
  transaction_date: Date;
  is_installment: boolean;
  total_installments: number;
  is_reimbursable: boolean;
  reimbursement_source?: string;
  notes?: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  initial_balance: number;
  color?: string;
  icon?: string;
}

export interface CreditCardFormData {
  name: string;
  brand?: string;
  last_four_digits?: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color?: string;
  account_id?: string;
}
