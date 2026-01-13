/**
 * Finansix Database Types
 * Compatible with Supabase client
 * * Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
 * to regenerate from live database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
// ============================================================================

export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'
export type InstallmentStatus = 'pending' | 'paid' | 'overdue'
export type ReimbursementStatus = 'pending' | 'partial' | 'received' | 'written_off'
export type AccountType = 'checking' | 'savings' | 'cash' | 'investment'
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type HouseholdRole = 'owner' | 'admin' | 'member' | 'viewer'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type SubscriptionBillingCycle = 'monthly' | 'yearly' | 'weekly'

// ============================================================================
// DATABASE INTERFACE - Supabase Compatible
// ============================================================================

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          name?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: HouseholdRole
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: HouseholdRole
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          role?: HouseholdRole
          display_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      household_invites: {
        Row: {
          id: string
          household_id: string
          email: string
          role: HouseholdRole
          status: InviteStatus
          invited_by: string
          token: string
          expires_at: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          email: string
          role?: HouseholdRole
          status?: InviteStatus
          invited_by: string
          token?: string
          expires_at?: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          status?: InviteStatus
          accepted_at?: string | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          name: string
          type: AccountType
          currency: string
          initial_balance: number
          current_balance: number
          current_balance_cents: number
          color: string | null
          icon: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          // Bank details
          bank_code: string | null
          bank_name: string | null
          branch_number: string | null
          account_number: string | null
          account_digit: string | null
          pix_key: string | null
          pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: AccountType
          currency?: string
          initial_balance?: number
          current_balance?: number
          current_balance_cents?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          // Bank details
          bank_code?: string | null
          bank_name?: string | null
          branch_number?: string | null
          account_number?: string | null
          account_digit?: string | null
          pix_key?: string | null
          pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
        }
        Update: {
          name?: string
          type?: AccountType
          currency?: string
          initial_balance?: number
          current_balance?: number
          current_balance_cents?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
          updated_at?: string
          deleted_at?: string | null
          // Bank details
          bank_code?: string | null
          bank_name?: string | null
          branch_number?: string | null
          account_number?: string | null
          account_digit?: string | null
          pix_key?: string | null
          pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          id: string
          household_id: string
          account_id: string | null
          name: string
          last_four_digits: string | null
          brand: string | null
          color: string | null
          icon: string | null
          credit_limit: number
          credit_limit_cents: number
          closing_day: number
          due_day: number
          grace_period_days: number
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          account_id?: string | null
          name: string
          last_four_digits?: string | null
          brand?: string | null
          color?: string | null
          icon?: string | null
          credit_limit: number
          credit_limit_cents?: number
          closing_day: number
          due_day: number
          grace_period_days?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          account_id?: string | null
          name?: string
          last_four_digits?: string | null
          brand?: string | null
          color?: string | null
          icon?: string | null
          credit_limit?: number
          credit_limit_cents?: number
          closing_day?: number
          due_day?: number
          grace_period_days?: number
          is_active?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          household_id: string | null
          parent_id: string | null
          name: string
          type: TransactionType | null
          color: string | null
          icon: string | null
          is_favorite: boolean
          default_amount: number | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id?: string | null
          parent_id?: string | null
          name: string
          type?: TransactionType | null
          color?: string | null
          icon?: string | null
          is_favorite?: boolean
          default_amount?: number | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          parent_id?: string | null
          name?: string
          type?: TransactionType | null
          color?: string | null
          icon?: string | null
          is_favorite?: boolean
          default_amount?: number | null
          sort_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          account_id: string | null
          credit_card_id: string | null
          category_id: string | null
          type: TransactionType
          status: TransactionStatus
          amount: number
          amount_cents: number
          currency: string
          description: string
          notes: string | null
          transaction_date: string
          is_installment: boolean
          total_installments: number
          current_installment: number | null
          is_recurring: boolean
          recurrence_type: RecurrenceType | null
          recurrence_end_date: string | null
          parent_transaction_id: string | null
          is_reimbursable: boolean
          reimbursement_status: ReimbursementStatus | null
          reimbursement_source: string | null
          reimbursed_amount: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          household_id: string
          account_id?: string | null
          credit_card_id?: string | null
          category_id?: string | null
          type: TransactionType
          status?: TransactionStatus
          amount: number
          amount_cents?: number
          currency?: string
          description: string
          notes?: string | null
          transaction_date?: string
          is_installment?: boolean
          total_installments?: number
          current_installment?: number | null
          is_recurring?: boolean
          recurrence_type?: RecurrenceType | null
          recurrence_end_date?: string | null
          parent_transaction_id?: string | null
          is_reimbursable?: boolean
          reimbursement_status?: ReimbursementStatus | null
          reimbursement_source?: string | null
          reimbursed_amount?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          account_id?: string | null
          credit_card_id?: string | null
          category_id?: string | null
          type?: TransactionType
          status?: TransactionStatus
          amount?: number
          amount_cents?: number
          currency?: string
          description?: string
          notes?: string | null
          transaction_date?: string
          is_installment?: boolean
          total_installments?: number
          current_installment?: number | null
          is_recurring?: boolean
          recurrence_type?: RecurrenceType | null
          recurrence_end_date?: string | null
          parent_transaction_id?: string | null
          is_reimbursable?: boolean
          reimbursement_status?: ReimbursementStatus | null
          reimbursement_source?: string | null
          reimbursed_amount?: number
          updated_at?: string
          deleted_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      installments: {
        Row: {
          id: string
          household_id: string
          transaction_id: string
          credit_card_id: string | null
          installment_number: number
          total_installments: number
          amount: number
          amount_cents: number
          due_date: string
          billing_month: string
          status: InstallmentStatus
          paid_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          transaction_id: string
          credit_card_id?: string | null
          installment_number: number
          total_installments: number
          amount: number
          amount_cents?: number
          due_date: string
          status?: InstallmentStatus
          paid_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          credit_card_id?: string | null
          installment_number?: number
          total_installments?: number
          amount?: number
          amount_cents?: number
          due_date?: string
          status?: InstallmentStatus
          paid_at?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          household_id: string
          name: string
          amount: number | null
          billing_day: number
          billing_cycle: SubscriptionBillingCycle
          category_id: string | null
          credit_card_id: string | null
          account_id: string | null
          is_active: boolean
          start_date: string | null
          end_date: string | null
          icon: string | null
          color: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          amount?: number | null
          billing_day: number
          billing_cycle?: SubscriptionBillingCycle
          category_id?: string | null
          credit_card_id?: string | null
          account_id?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          icon?: string | null
          color?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          name?: string
          amount?: number | null
          billing_day?: number
          billing_cycle?: SubscriptionBillingCycle
          category_id?: string | null
          credit_card_id?: string | null
          account_id?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          icon?: string | null
          color?: string | null
          notes?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      credit_card_statements: {
        Row: {
          id: string
          household_id: string
          credit_card_id: string
          closing_date: string
          due_date: string
          total_amount: number
          paid_amount: number
          is_paid: boolean
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          credit_card_id: string
          closing_date: string
          due_date: string
          total_amount?: number
          paid_amount?: number
          is_paid?: boolean
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_amount?: number
          paid_amount?: number
          is_paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expected_transactions: {
        Row: {
          id: string
          household_id: string
          description: string
          amount: number
          type: TransactionType
          expected_date: string
          category_id: string | null
          is_recurring: boolean
          recurrence_type: RecurrenceType | null
          confidence_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          description: string
          amount: number
          type: TransactionType
          expected_date: string
          category_id?: string | null
          is_recurring?: boolean
          recurrence_type?: RecurrenceType | null
          confidence_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          description?: string
          amount?: number
          type?: TransactionType
          expected_date?: string
          category_id?: string | null
          is_recurring?: boolean
          recurrence_type?: RecurrenceType | null
          confidence_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_card_limits: {
        Row: {
          id: string
          household_id: string
          credit_limit: number
          credit_limit_cents: number
          used_limit: number
          used_limit_cents: number
          available_limit: number
          available_limit_cents: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: {
      free_balance_view: {
        Row: {
          household_id: string
          current_balance: number
          pending_expenses: number
          credit_card_due: number
          expected_income: number
          expected_expenses: number
          pending_reimbursements: number
          free_balance: number
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_household_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      setup_user_household: {
        Args: { user_name: string | undefined }
        Returns: string
      }
    }
    Enums: {
      transaction_type: TransactionType
      transaction_status: TransactionStatus
      installment_status: InstallmentStatus
      reimbursement_status: ReimbursementStatus
      account_type: AccountType
      recurrence_type: RecurrenceType
      household_role: HouseholdRole
      invite_status: InviteStatus
      subscription_billing_cycle: SubscriptionBillingCycle
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// HELPER TYPES - Supabase Standard
// ============================================================================

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

// ============================================================================
// CONVENIENCE TYPE ALIASES
// ============================================================================

// Row types (for reading from database)
export type Household = Tables<'households'>
export type HouseholdMember = Tables<'household_members'>
export type HouseholdInvite = Tables<'household_invites'>
export type Account = Tables<'accounts'>
export type CreditCard = Tables<'credit_cards'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
export type Installment = Tables<'installments'>
export type Subscription = Tables<'subscriptions'>
export type CreditCardStatement = Tables<'credit_card_statements'>
export type ExpectedTransaction = Tables<'expected_transactions'>

// Insert types (for creating records)
export type InsertHousehold = TablesInsert<'households'>
export type InsertHouseholdMember = TablesInsert<'household_members'>
export type InsertHouseholdInvite = TablesInsert<'household_invites'>
export type InsertAccount = TablesInsert<'accounts'>
export type InsertCreditCard = TablesInsert<'credit_cards'>
export type InsertCategory = TablesInsert<'categories'>
export type InsertTransaction = TablesInsert<'transactions'>
export type InsertInstallment = TablesInsert<'installments'>
export type InsertSubscription = TablesInsert<'subscriptions'>
export type InsertCreditCardStatement = TablesInsert<'credit_card_statements'>
export type InsertExpectedTransaction = TablesInsert<'expected_transactions'>

// Update types (for updating records)
export type UpdateHousehold = TablesUpdate<'households'>
export type UpdateHouseholdMember = TablesUpdate<'household_members'>
export type UpdateHouseholdInvite = TablesUpdate<'household_invites'>
export type UpdateAccount = TablesUpdate<'accounts'>
export type UpdateCreditCard = TablesUpdate<'credit_cards'>
export type UpdateCategory = TablesUpdate<'categories'>
export type UpdateTransaction = TablesUpdate<'transactions'>
export type UpdateInstallment = TablesUpdate<'installments'>
export type UpdateSubscription = TablesUpdate<'subscriptions'>
export type UpdateCreditCardStatement = TablesUpdate<'credit_card_statements'>
export type UpdateExpectedTransaction = TablesUpdate<'expected_transactions'>

// Legacy alias for backward compatibility
export type InsertTables<T extends keyof Database['public']['Tables']> = TablesInsert<T>
export type UpdateTables<T extends keyof Database['public']['Tables']> = TablesUpdate<T>