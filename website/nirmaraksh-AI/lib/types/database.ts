export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  has_downloaded: boolean | null
  created_at: string
  updated_at: string
}

export interface Release {
  id: string
  version: string
  platform: 'windows' | 'mac' | 'linux'
  file_name: string
  download_url: string
  file_size_bytes: number
  sha256_checksum: string
  release_notes?: string | null
  is_latest: boolean | null
  download_count: number | null
  published_at: string
}

export interface DownloadEvent {
  id: number
  release_id: string | null
  platform: string
  user_id: string | null
  ip_hash: string
  country: string | null
  created_at: string
}

export interface DemoMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      demo_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      download_events: {
        Row: {
          country: string | null
          created_at: string
          id: number
          ip_hash: string
          platform: string
          release_id: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: number
          ip_hash: string
          platform: string
          release_id?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: number
          ip_hash?: string
          platform?: string
          release_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_events_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          has_downloaded: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          has_downloaded?: boolean | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          has_downloaded?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      releases: {
        Row: {
          download_count: number | null
          download_url: string
          file_name: string
          file_size_bytes: number
          id: string
          is_latest: boolean | null
          platform: 'windows' | 'mac' | 'linux'
          published_at: string
          release_notes: string | null
          sha256_checksum: string
          version: string
        }
        Insert: {
          download_count?: number | null
          download_url: string
          file_name: string
          file_size_bytes: number
          id?: string
          is_latest?: boolean | null
          platform: 'windows' | 'mac' | 'linux'
          published_at?: string
          release_notes?: string | null
          sha256_checksum: string
          version: string
        }
        Update: {
          download_count?: number | null
          download_url?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          is_latest?: boolean | null
          platform?: 'windows' | 'mac' | 'linux'
          published_at?: string
          release_notes?: string | null
          sha256_checksum?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_download_event: {
        Args: {
          p_country?: string
          p_ip_hash: string
          p_platform: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
