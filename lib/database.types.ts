export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          conversation_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      message_status: {
        Row: {
          message_id: string
          profile_id: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          message_id: string
          profile_id: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          message_id?: string
          profile_id?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type MessageStatus = Database["public"]["Tables"]["message_status"]["Row"]
