export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          color: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          deleted_at: string | null
          household_id: string
          icon: string | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          deleted_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          deleted_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          default_amount: number | null
          household_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_favorite: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["transaction_type"] | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_amount?: number | null
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_amount?: number | null
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_statements: {
        Row: {
          billing_month: string
          closing_date: string
          created_at: string | null
          credit_card_id: string
          due_date: string
          household_id: string
          id: string
          is_closed: boolean | null
          is_paid: boolean | null
          paid_amount: number | null
          paid_at: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          billing_month: string
          closing_date: string
          created_at?: string | null
          credit_card_id: string
          due_date: string
          household_id: string
          id?: string
          is_closed?: boolean | null
          is_paid?: boolean | null
          paid_amount?: number | null
          paid_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_month?: string
          closing_date?: string
          created_at?: string | null
          credit_card_id?: string
          due_date?: string
          household_id?: string
          id?: string
          is_closed?: boolean | null
          is_paid?: boolean | null
          paid_amount?: number | null
          paid_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_statements_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card_limits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_statements_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_statements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          account_id: string | null
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string | null
          credit_limit: number
          deleted_at: string | null
          due_day: number
          grace_period_days: number | null
          household_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          last_four_digits: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string | null
          credit_limit: number
          deleted_at?: string | null
          due_day: number
          grace_period_days?: number | null
          household_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number
          deleted_at?: string | null
          due_day?: number
          grace_period_days?: number | null
          household_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      expected_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          confidence_percent: number | null
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          description: string
          end_date: string | null
          household_id: string
          id: string
          is_active: boolean | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          start_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          confidence_percent?: number | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          description: string
          end_date?: string | null
          household_id: string
          id?: string
          is_active?: boolean | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          start_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          confidence_percent?: number | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string
          end_date?: string | null
          household_id?: string
          id?: string
          is_active?: boolean | null
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"]
          start_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expected_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expected_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expected_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string | null
          display_name: string | null
          household_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          household_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          household_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          billing_month: string
          created_at: string | null
          credit_card_id: string | null
          deleted_at: string | null
          due_date: string
          household_id: string
          id: string
          installment_number: number
          paid_amount: number | null
          paid_at: string | null
          status: Database["public"]["Enums"]["installment_status"] | null
          total_installments: number
          transaction_id: string
        }
        Insert: {
          amount: number
          billing_month: string
          created_at?: string | null
          credit_card_id?: string | null
          deleted_at?: string | null
          due_date: string
          household_id: string
          id?: string
          installment_number: number
          paid_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"] | null
          total_installments: number
          transaction_id: string
        }
        Update: {
          amount?: number
          billing_month?: string
          created_at?: string | null
          credit_card_id?: string | null
          deleted_at?: string | null
          due_date?: string
          household_id?: string
          id?: string
          installment_number?: number
          paid_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"] | null
          total_installments?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card_limits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          billing_month: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          credit_card_id: string | null
          currency: string | null
          deleted_at: string | null
          description: string
          household_id: string
          id: string
          installment_number: number | null
          is_installment: boolean | null
          is_recurring: boolean | null
          is_reimbursable: boolean | null
          notes: string | null
          parent_transaction_id: string | null
          recurrence_end_date: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"] | null
          reimbursed_amount: number | null
          reimbursement_source: string | null
          reimbursement_status:
            | Database["public"]["Enums"]["reimbursement_status"]
            | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          total_installments: number | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          billing_month?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_card_id?: string | null
          currency?: string | null
          deleted_at?: string | null
          description: string
          household_id: string
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          is_reimbursable?: boolean | null
          notes?: string | null
          parent_transaction_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          reimbursed_amount?: number | null
          reimbursement_source?: string | null
          reimbursement_status?:
            | Database["public"]["Enums"]["reimbursement_status"]
            | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          total_installments?: number | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          billing_month?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_card_id?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string
          household_id?: string
          id?: string
          installment_number?: number | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          is_reimbursable?: boolean | null
          notes?: string | null
          parent_transaction_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          reimbursed_amount?: number | null
          reimbursement_source?: string | null
          reimbursement_status?:
            | Database["public"]["Enums"]["reimbursement_status"]
            | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          total_installments?: number | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card_limits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      credit_card_limits: {
        Row: {
          available_limit: number | null
          credit_limit: number | null
          household_id: string | null
          id: string | null
          name: string | null
          used_limit: number | null
        }
        Insert: {
          available_limit?: never
          credit_limit?: number | null
          household_id?: string | null
          id?: string | null
          name?: string | null
          used_limit?: never
        }
        Update: {
          available_limit?: never
          credit_limit?: number | null
          household_id?: string | null
          id?: string | null
          name?: string | null
          used_limit?: never
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_summary: {
        Row: {
          balance: number | null
          household_id: string | null
          month: string | null
          total_expenses: number | null
          total_income: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_household_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      account_type: "checking" | "savings" | "cash" | "investment"
      installment_status: "pending" | "paid" | "overdue"
      recurrence_type: "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
      reimbursement_status: "pending" | "partial" | "received" | "written_off"
      transaction_status: "pending" | "completed" | "cancelled"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Helper types for easier use
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

// Enums
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type TransactionStatus = Database['public']['Enums']['transaction_status'];
export type InstallmentStatus = Database['public']['Enums']['installment_status'];
export type ReimbursementStatus = Database['public']['Enums']['reimbursement_status'];
export type AccountType = Database['public']['Enums']['account_type'];
export type RecurrenceType = Database['public']['Enums']['recurrence_type'];

