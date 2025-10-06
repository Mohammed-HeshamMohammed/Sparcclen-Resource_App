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
      // Resource-related tables (categories, resources, tags, resource_tags)
      // have been moved to the local encrypted store. They are intentionally
      // omitted from the Supabase-side `Database` typing to avoid confusion
      // and accidental server-side writes. Keep Supabase-only tables here.
      favorites: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          user_id: string
          passkey_hash: string | null
          totp_secret: string | null
          theme: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          passkey_hash?: string | null
          totp_secret?: string | null
          theme?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          passkey_hash?: string | null
          totp_secret?: string | null
          theme?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      slugify: {
        Args: { text: string }
        Returns: string
      }
      compute_favicon_url: {
        Args: { url: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
