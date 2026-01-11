export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_digit: string | null
          account_number: string | null
          balance_cents: number | null
          bank_code: string | null
          bank_name: string | null
          branch_number: string | null
          color: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          current_balance_cents: number
          deleted_at: string | null
          household_id: string
          icon: string | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          pix_key: string | null
          pix_key_type: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
        }
        Insert: {
          account_digit?: string | null
          account_number?: string | null
          balance_cents?: number | null
          bank_code?: string | null
          bank_name?: string | null
          branch_number?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          current_balance_cents?: number
          deleted_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          pix_key?: string | null
          pix_key_type?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Update: {
          account_digit?: string | null
          account_number?: string | null
          balance_cents?: number | null
          bank_code?: string | null
          bank_name?: string | null
          branch_number?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          current_balance_cents?: number
          deleted_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          pix_key?: string | null
          pix_key_type?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
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
          minimum_amount: number | null
          paid_amount: number | null
          paid_at: string | null
          status: string
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
          minimum_amount?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          status?: string
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
          minimum_amount?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          status?: string
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
          available_limit_cents: number | null
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string | null
          credit_limit: number
          credit_limit_cents: number | null
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
          available_limit_cents?: number | null
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string | null
          credit_limit: number
          credit_limit_cents?: number | null
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
          available_limit_cents?: number | null
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number
          credit_limit_cents?: number | null
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          household_id: string
          id?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "household_invites_household_id_fkey"
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
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
          amount_cents: number
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
          total_amount_cents: number | null
          total_installments: number
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_cents: number
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
          total_amount_cents?: number | null
          total_installments: number
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_cents?: number
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
          total_amount_cents?: number | null
          total_installments?: number
          transaction_id?: string
          updated_at?: string | null
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_with_installments_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_day: number
          category: string | null
          created_at: string | null
          credit_card_id: string | null
          household_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_day: number
          category?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          household_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_day?: number
          category?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card_limits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "subscriptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          amount_cents: number | null
          attachment_url: string | null
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
          paid_amount: number | null
          paid_at: string | null
          parent_transaction_id: string | null
          payment_status: string | null
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
          amount_cents?: number | null
          attachment_url?: string | null
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
          paid_amount?: number | null
          paid_at?: string | null
          parent_transaction_id?: string | null
          payment_status?: string | null
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
          amount_cents?: number | null
          attachment_url?: string | null
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
          paid_amount?: number | null
          paid_at?: string | null
          parent_transaction_id?: string | null
          payment_status?: string | null
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_with_installments_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      credit_card_limits: {
        Row: {
          available_limit: number | null
          available_limit_cents: number | null
          credit_limit: number | null
          credit_limit_cents: number | null
          household_id: string | null
          id: string | null
          name: string | null
          used_limit: number | null
          used_limit_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
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
      household_free_balance: {
        Row: {
          credit_card_due: number | null
          current_balance: number | null
          expected_expenses: number | null
          expected_income: number | null
          free_balance: number | null
          household_id: string | null
          household_name: string | null
          pending_expenses: number | null
        }
        Relationships: []
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_with_installments_expanded: {
        Row: {
          account_id: string | null
          account_name: string | null
          amount: number | null
          amount_cents: number | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          credit_card_id: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          household_id: string | null
          id: string | null
          installment_amount: number | null
          installment_amount_cents: number | null
          installment_id: string | null
          installment_number: number | null
          installment_status:
            | Database["public"]["Enums"]["installment_status"]
            | null
          is_recurring: boolean | null
          is_reimbursable: boolean | null
          notes: string | null
          reimbursed_amount: number | null
          reimbursed_amount_cents: number | null
          reimbursement_status:
            | Database["public"]["Enums"]["reimbursement_status"]
            | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          total_installments: number | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          updated_at: string | null
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
            referencedRelation: "household_free_balance"
            referencedColumns: ["household_id"]
          },
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
      cents_to_reais: { Args: { amount_cents: number }; Returns: number }
      clean_expired_invites: { Args: never; Returns: undefined }
      create_transaction_with_installments: {
        Args: { p_generate_installments?: boolean; p_transaction: Json }
        Returns: string
      }
      delete_transaction_cascade: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      get_household_free_balance: {
        Args: { p_household_id: string; p_target_date?: string }
        Returns: {
          credit_card_due: number
          current_balance: number
          expected_expenses: number
          expected_income: number
          free_balance: number
          household_id: string
          household_name: string
          pending_expenses: number
        }[]
      }
      get_monthly_transactions: {
        Args: { p_household_id: string; p_month: number; p_year: number }
        Returns: {
          account_id: string
          amount: number
          billing_month: string
          category_id: string
          credit_card_id: string
          description: string
          due_date: string
          household_id: string
          installment_number: number
          is_installment: boolean
          status: string
          total_installments: number
          transaction_date: string
          transaction_id: string
          type: string
          virtual_id: string
        }[]
      }
      get_payment_summary: { Args: { p_household_id: string }; Returns: Json }
      get_subscription_total: {
        Args: { p_household_id: string }
        Returns: number
      }
      get_upcoming_subscriptions: {
        Args: { p_household_id: string }
        Returns: {
          amount: number
          billing_day: number
          credit_card_id: string
          days_until: number
          id: string
          name: string
        }[]
      }
      get_user_household_id: { Args: never; Returns: string }
      get_user_household_ids: { Args: never; Returns: string[] }
      pay_bill: {
        Args: {
          p_paid_amount: number
          p_payment_type?: string
          p_transaction_id: string
        }
        Returns: Json
      }
      pay_credit_card_invoice: {
        Args: {
          p_billing_month: string
          p_card_id: string
          p_paid_amount: number
          p_payment_type?: string
        }
        Returns: Json
      }
      setup_user_household: { Args: { user_name?: string }; Returns: string }
    }
    Enums: {
      account_type: "checking" | "savings" | "cash" | "investment"
      installment_status:
        | "pending"
        | "paid"
        | "overdue"
        | "partial"
        | "cancelled"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["checking", "savings", "cash", "investment"],
      installment_status: [
        "pending",
        "paid",
        "overdue",
        "partial",
        "cancelled",
      ],
      recurrence_type: ["daily", "weekly", "biweekly", "monthly", "yearly"],
      reimbursement_status: ["pending", "partial", "received", "written_off"],
      transaction_status: ["pending", "completed", "cancelled"],
      transaction_type: ["income", "expense", "transfer"],
    },
  },
} as const
