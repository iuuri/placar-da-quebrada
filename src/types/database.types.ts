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
      campeonatos: {
        Row: {
          id: string
          nome: string
          slug: string
          temporada: string
          modalidade: Database['public']['Enums']['modalidade']
          local_padrao: string | null
          status: Database['public']['Enums']['status_campeonato']
          publico: boolean
          pontos_vitoria: number
          pontos_empate: number
          pontos_derrota: number
          qtd_periodos: number
          minutos_periodo: number
          criterios_desempate: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          nome: string
          slug: string
          temporada?: string
          modalidade?: Database['public']['Enums']['modalidade']
          local_padrao?: string | null
          status?: Database['public']['Enums']['status_campeonato']
          publico?: boolean
          pontos_vitoria?: number
          pontos_empate?: number
          pontos_derrota?: number
          qtd_periodos?: number
          minutos_periodo?: number
          criterios_desempate?: string[]
        }
        Update: Partial<Database['public']['Tables']['campeonatos']['Insert']>
        Relationships: []
      }
      times: {
        Row: {
          id: string
          campeonato_id: string
          nome: string
          sigla: string
          cor_primaria: string
          escudo_url: string | null
          responsavel: string | null
          contato: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          campeonato_id: string
          nome: string
          sigla: string
          cor_primaria?: string
          escudo_url?: string | null
          responsavel?: string | null
          contato?: string | null
        }
        Update: Partial<Database['public']['Tables']['times']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'times_campeonato_id_fkey'
            columns: ['campeonato_id']
            isOneToOne: false
            referencedRelation: 'campeonatos'
            referencedColumns: ['id']
          },
        ]
      }
      jogadores: {
        Row: {
          id: string
          time_id: string
          nome: string
          apelido: string | null
          numero: number | null
          posicao: string | null
          foto_url: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          time_id: string
          nome: string
          apelido?: string | null
          numero?: number | null
          posicao?: string | null
          foto_url?: string | null
          ativo?: boolean
        }
        Update: Partial<Database['public']['Tables']['jogadores']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'jogadores_time_id_fkey'
            columns: ['time_id']
            isOneToOne: false
            referencedRelation: 'times'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      papel_usuario: 'admin' | 'operador'
      status_campeonato: 'rascunho' | 'inscricoes' | 'em_andamento' | 'finalizado'
      modalidade: 'campo' | 'society' | 'futsal'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type PapelUsuario = Database['public']['Enums']['papel_usuario']
export type Campeonato = Database['public']['Tables']['campeonatos']['Row']
export type Time = Database['public']['Tables']['times']['Row']
export type Jogador = Database['public']['Tables']['jogadores']['Row']
