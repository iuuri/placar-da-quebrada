// Espelha supabase/migrations. Regerar com `supabase gen types typescript` (MCP ou pipeline)
// quando o schema mudar; até lá, manter em sincronia manualmente.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          role: Database['public']['Enums']['papel_usuario']
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nome?: string
          role?: Database['public']['Enums']['papel_usuario']
          ativo?: boolean
        }
        Update: {
          nome?: string
          role?: Database['public']['Enums']['papel_usuario']
          ativo?: boolean
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      papel_usuario: 'admin' | 'operador'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type PapelUsuario = Database['public']['Enums']['papel_usuario']
