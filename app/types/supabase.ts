export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
          subscription_plan: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'expired' | 'trial'
          trial_ends_at: string
          total_tokens_used: number
          monthly_tokens_used: number
          tokens_reset_date: string
          tokens_limit: number
          theme: string
          last_login_at: string | null
          login_count: number
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'expired' | 'trial'
          trial_ends_at?: string
          total_tokens_used?: number
          monthly_tokens_used?: number
          tokens_reset_date?: string
          tokens_limit?: number
          theme?: string
          last_login_at?: string | null
          login_count?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'expired' | 'trial'
          trial_ends_at?: string
          total_tokens_used?: number
          monthly_tokens_used?: number
          tokens_reset_date?: string
          tokens_limit?: number
          theme?: string
          last_login_at?: string | null
          login_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_plan: 'free' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'expired' | 'trial'
    }
  }
} 