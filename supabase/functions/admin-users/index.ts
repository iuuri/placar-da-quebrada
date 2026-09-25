// Edge Function admin-users: operações que exigem a chave de serviço (service_role).
// Só um admin ativo pode chamar. A chave de serviço é injetada pelo Supabase e nunca vai para o navegador.
//
// POST { acao: 'criar', nome, email, senha, role }
// POST { acao: 'trocar_senha', userId, senha }
// POST { acao: 'definir_ativo', userId, ativo }

import { createClient } from '@supabase/supabase-js'

const ORIGENS_PERMITIDAS = [
  /^https:\/\/placar-da-quebrada\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.placar-da-quebrada\.pages\.dev$/,
  /^http:\/\/localhost:\d+$/,
]

function cabecalhosCors(origem: string | null): Record<string, string> {
  const permitida = origem && ORIGENS_PERMITIDAS.some((re) => re.test(origem)) ? origem : 'null'
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function resposta(status: number, corpo: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Entrada =
  | { acao: 'criar'; nome: string; email: string; senha: string; role: 'admin' | 'operador' }
  | { acao: 'trocar_senha'; userId: string; senha: string }
  | { acao: 'definir_ativo'; userId: string; ativo: boolean }

// Valida o corpo; devolve mensagem de erro em português ou null.
function validar(e: Partial<Record<string, unknown>>): string | null {
  const senhaOk = (s: unknown) => typeof s === 'string' && s.length >= 8 && s.length <= 72
  switch (e.acao) {
    case 'criar':
      if (typeof e.nome !== 'string' || e.nome.trim().length < 2) return 'Informe o nome.'
      if (typeof e.email !== 'string' || !EMAIL.test(e.email)) return 'E-mail inválido.'
      if (!senhaOk(e.senha)) return 'A senha precisa ter de 8 a 72 caracteres.'
      if (e.role !== 'admin' && e.role !== 'operador') return 'Papel inválido.'
      return null
    case 'trocar_senha':
      if (typeof e.userId !== 'string' || !UUID.test(e.userId)) return 'Usuário inválido.'
      if (!senhaOk(e.senha)) return 'A senha precisa ter de 8 a 72 caracteres.'
      return null
    case 'definir_ativo':
      if (typeof e.userId !== 'string' || !UUID.test(e.userId)) return 'Usuário inválido.'
      if (typeof e.ativo !== 'boolean') return 'Status inválido.'
      return null
    default:
      return 'Ação desconhecida.'
  }
}

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return resposta(405, { erro: 'Método não permitido.' }, cors)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Quem está chamando? (o gateway já validou o JWT; aqui buscamos o usuário e o perfil)
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return resposta(401, { erro: 'Faça login novamente.' }, cors)
  const { data: quem, error: erroUsuario } = await admin.auth.getUser(token)
  if (erroUsuario || !quem.user) return resposta(401, { erro: 'Sessão expirada. Faça login novamente.' }, cors)

  const { data: perfil } = await admin
    .from('profiles')
    .select('role, ativo')
    .eq('id', quem.user.id)
    .maybeSingle()
  if (!perfil || perfil.role !== 'admin' || !perfil.ativo) {
    return resposta(403, { erro: 'Só o organizador (admin) pode fazer isso.' }, cors)
  }

  let entrada: Entrada
  try {
    entrada = await req.json()
  } catch {
    return resposta(400, { erro: 'Pedido inválido.' }, cors)
  }
  const invalido = validar(entrada as unknown as Record<string, unknown>)
  if (invalido) return resposta(400, { erro: invalido }, cors)

  if (entrada.acao !== 'criar' && entrada.userId === quem.user.id) {
    return resposta(400, { erro: 'Use a tela de recuperar senha para a sua própria conta.' }, cors)
  }

  if (entrada.acao === 'criar') {
    const { data, error } = await admin.auth.admin.createUser({
      email: entrada.email.trim().toLowerCase(),
      password: entrada.senha,
      email_confirm: true,
      user_metadata: { nome: entrada.nome.trim() },
    })
    if (error) {
      const jaExiste = error.code === 'email_exists' || /already/i.test(error.message)
      return resposta(jaExiste ? 409 : 400, { erro: jaExiste ? 'Já existe um usuário com esse e-mail.' : 'Não foi possível criar o usuário.' }, cors)
    }
    // O trigger on_auth_user_created cria o perfil como operador.
    if (entrada.role === 'admin') {
      await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
    }
    return resposta(201, { id: data.user.id }, cors)
  }

  if (entrada.acao === 'trocar_senha') {
    const { error } = await admin.auth.admin.updateUserById(entrada.userId, { password: entrada.senha })
    if (error) return resposta(400, { erro: 'Não foi possível trocar a senha.' }, cors)
    return resposta(200, { ok: true }, cors)
  }

  // definir_ativo: marca o perfil e bloqueia/desbloqueia o login no Auth (derruba sessões ao bloquear).
  const { error: erroPerfil } = await admin.from('profiles').update({ ativo: entrada.ativo }).eq('id', entrada.userId)
  if (erroPerfil) return resposta(400, { erro: 'Não foi possível atualizar o usuário.' }, cors)
  const { error: erroBan } = await admin.auth.admin.updateUserById(entrada.userId, {
    ban_duration: entrada.ativo ? 'none' : '876000h',
  })
  if (erroBan) return resposta(400, { erro: 'Perfil atualizado, mas não foi possível bloquear o login.' }, cors)
  return resposta(200, { ok: true }, cors)
})
