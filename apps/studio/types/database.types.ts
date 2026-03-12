export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  denovo: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'pro'
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status: 'active' | 'canceled' | 'past_due'
          period_start: string | null
          period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'past_due'
          period_start?: string | null
          period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'past_due'
          period_start?: string | null
          period_end?: string | null
          updated_at?: string
        }
      }
      runs: {
        Row: {
          id: string
          user_id: string
          prompt: string
          mode: string | null
          status: 'pending' | 'running' | 'complete' | 'failed'
          artifacts_path: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          mode?: string | null
          status?: 'pending' | 'running' | 'complete' | 'failed'
          artifacts_path?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          prompt?: string
          mode?: string | null
          status?: 'pending' | 'running' | 'complete' | 'failed'
          artifacts_path?: string | null
          completed_at?: string | null
        }
      }
      run_counts: {
        Row: { user_id: string; month: string; count: number }
        Insert: { user_id: string; month: string; count?: number }
        Update: { count?: number }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
