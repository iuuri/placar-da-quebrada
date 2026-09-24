import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { buscarProfile, observarSessao, sessaoAtual } from './api'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)

  useEffect(() => {
    sessaoAtual().then((s) => {
      setSession(s)
      setCarregandoSessao(false)
    })
    return observarSessao((evento, s) => {
      setSession(s)
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
    })
  }, [])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => buscarProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  })

  const profile = profileQuery.data ?? null
  const carregando = carregandoSessao || (Boolean(userId) && profileQuery.isPending)

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        carregando,
        erroProfile: profileQuery.error,
        recuperandoSenha,
        isAdmin: profile?.role === 'admin' && profile.ativo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
