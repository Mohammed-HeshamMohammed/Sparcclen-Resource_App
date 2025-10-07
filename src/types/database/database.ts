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
      categories: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          parent_id: string | null
          sort_order: number
          item_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          item_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          item_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          url: string | null
          category_id: string | null
          subcategory_id: string | null
          resource_type: string | null
          thumbnail_url: string | null
          thumbnail_type: string | null
          colors: Json | null
          metadata: Json | null
          view_count: number
          date_added: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          url?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          resource_type?: string | null
          thumbnail_url?: string | null
          thumbnail_type?: string | null
          colors?: Json | null
          metadata?: Json | null
          view_count?: number
          date_added?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          url?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          resource_type?: string | null
          thumbnail_url?: string | null
          thumbnail_type?: string | null
          colors?: Json | null
          metadata?: Json | null
          view_count?: number
          date_added?: string
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          usage_count?: number
          created_at?: string
        }
      }
      resource_tags: {
        Row: {
          id: string
          resource_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          tag_id?: string
          created_at?: string
        }
      }
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
