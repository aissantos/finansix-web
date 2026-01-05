export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type ReimbursementStatus = 'pending' | 'partial' | 'received' | 'written_off';
export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type HouseholdRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: HouseholdRole;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: HouseholdRole;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: HouseholdRole;
          display_name?: string | null;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: AccountType;
          currency: string;
          initial_balance: number;
          current_balance: number;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: AccountType;
          currency?: string;
          initial_balance?: number;
          current_balance?: number;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?: AccountType;
          currency?: string;
          initial_balance?: number;
          current_balance?: number;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      credit_cards: {
        Row: {
          id: string;
          household_id: string;
          account_id: string | null;
          name: string;
          last_four_digits: string | null;
          brand: string | null;
          color: string | null;
          icon: string | null;
          credit_limit: number;
          closing_day: number;
          due_day: number;
          grace_period_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id?: string | null;
          name: string;
          last_four_digits?: string | null;
          brand?: string | null;
          color?: string | null;
          icon?: string | null;
          credit_limit: number;
          closing_day: number;
          due_day: number;
          grace_period_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          account_id?: string | null;
          name?: string;
          last_four_digits?: string | null;
          brand?: string | null;
          color?: string | null;
          icon?: string | null;
          credit_limit?: number;
          closing_day?: number;
          due_day?: number;
          grace_period_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          household_id: string | null;
          parent_id: string | null;
          name: string;
          type: TransactionType | null;
          color: string | null;
          icon: string | null;
          is_favorite: boolean;
          default_amount: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id?: string | null;
          parent_id?: string | null;
          name: string;
          type?: TransactionType | null;
          color?: string | null;
          icon?: string | null;
          is_favorite?: boolean;
          default_amount?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string | null;
          parent_id?: string | null;
          name?: string;
          type?: TransactionType | null;
          color?: string | null;
          icon?: string | null;
          is_favorite?: boolean;
          default_amount?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string | null;
          credit_card_id: string | null;
          category_id: string | null;
          type: TransactionType;
          status: TransactionStatus;
          amount: number;
          currency: string;
          description: string;
          notes: string | null;
          is_installment: boolean;
          total_installments: number;
          is_recurring: boolean;
          recurrence_type: RecurrenceType | null;
          recurrence_end_date: string | null;
          parent_transaction_id: string | null;
          is_reimbursable: boolean;
          reimbursement_status: ReimbursementStatus | null;
          reimbursement_source: string | null;
          reimbursed_amount: number;
          transaction_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id?: string | null;
          credit_card_id?: string | null;
          category_id?: string | null;
          type: TransactionType;
          status?: TransactionStatus;
          amount: number;
          currency?: string;
          description: string;
          notes?: string | null;
          is_installment?: boolean;
          total_installments?: number;
          is_recurring?: boolean;
          recurrence_type?: RecurrenceType | null;
          recurrence_end_date?: string | null;
          parent_transaction_id?: string | null;
          is_reimbursable?: boolean;
          reimbursement_status?: ReimbursementStatus | null;
          reimbursement_source?: string | null;
          reimbursed_amount?: number;
          transaction_date: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          account_id?: string | null;
          credit_card_id?: string | null;
          category_id?: string | null;
          type?: TransactionType;
          status?: TransactionStatus;
          amount?: number;
          currency?: string;
          description?: string;
          notes?: string | null;
          is_installment?: boolean;
          total_installments?: number;
          is_recurring?: boolean;
          recurrence_type?: RecurrenceType | null;
          recurrence_end_date?: string | null;
          parent_transaction_id?: string | null;
          is_reimbursable?: boolean;
          reimbursement_status?: ReimbursementStatus | null;
          reimbursement_source?: string | null;
          reimbursed_amount?: number;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      installments: {
        Row: {
          id: string;
          household_id: string;
          transaction_id: string;
          credit_card_id: string | null;
          installment_number: number;
          total_installments: number;
          amount: number;
          billing_month: string;
          due_date: string;
          status: InstallmentStatus;
          paid_at: string | null;
          paid_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          transaction_id: string;
          credit_card_id?: string | null;
          installment_number: number;
          total_installments: number;
          amount: number;
          billing_month: string;
          due_date: string;
          status?: InstallmentStatus;
          paid_at?: string | null;
          paid_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          transaction_id?: string;
          credit_card_id?: string | null;
          installment_number?: number;
          total_installments?: number;
          amount?: number;
          billing_month?: string;
          due_date?: string;
          status?: InstallmentStatus;
          paid_at?: string | null;
          paid_amount?: number | null;
          created_at?: string;
        };
      };
      credit_card_statements: {
        Row: {
          id: string;
          household_id: string;
          credit_card_id: string;
          billing_month: string;
          closing_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          is_closed: boolean;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          credit_card_id: string;
          billing_month: string;
          closing_date: string;
          due_date: string;
          total_amount?: number;
          paid_amount?: number;
          is_closed?: boolean;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          credit_card_id?: string;
          billing_month?: string;
          closing_date?: string;
          due_date?: string;
          total_amount?: number;
          paid_amount?: number;
          is_closed?: boolean;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expected_transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string | null;
          category_id: string | null;
          description: string;
          type: TransactionType;
          amount: number;
          recurrence_type: RecurrenceType;
          day_of_month: number | null;
          day_of_week: number | null;
          start_date: string;
          end_date: string | null;
          confidence_percent: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id?: string | null;
          category_id?: string | null;
          description: string;
          type: TransactionType;
          amount: number;
          recurrence_type: RecurrenceType;
          day_of_month?: number | null;
          day_of_week?: number | null;
          start_date: string;
          end_date?: string | null;
          confidence_percent?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          account_id?: string | null;
          category_id?: string | null;
          description?: string;
          type?: TransactionType;
          amount?: number;
          recurrence_type?: RecurrenceType;
          day_of_month?: number | null;
          day_of_week?: number | null;
          start_date?: string;
          end_date?: string | null;
          confidence_percent?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      credit_card_limits: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          credit_limit: number;
          available_limit: number;
          used_limit: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      installment_status: InstallmentStatus;
      reimbursement_status: ReimbursementStatus;
      account_type: AccountType;
      recurrence_type: RecurrenceType;
    };
  };
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

// Convenient aliases
export type Household = Tables<'households'>;
export type HouseholdMember = Tables<'household_members'>;
export type Account = Tables<'accounts'>;
export type CreditCard = Tables<'credit_cards'>;
export type Category = Tables<'categories'>;
export type Transaction = Tables<'transactions'>;
export type Installment = Tables<'installments'>;
export type CreditCardStatement = Tables<'credit_card_statements'>;
export type ExpectedTransaction = Tables<'expected_transactions'>;
export type CreditCardLimit = Views<'credit_card_limits'>;
