// Traduz erros do Supabase/PostgREST para mensagens da interface.
// `unicos` mapeia nome da constraint única -> mensagem específica.
export function mensagemErroBanco(error: unknown, unicos: Record<string, string> = {}): string {
  const e = (typeof error === 'object' && error ? error : {}) as { code?: string; message?: string }
  switch (e.code) {
    case '23505': {
      const constraint = Object.keys(unicos).find((nome) => e.message?.includes(nome))
      return constraint ? unicos[constraint] : 'Já existe um cadastro com esses dados.'
    }
    case '23514':
      return 'Algum campo tem um valor que não é permitido. Revise o formulário.'
    case '42501':
      return 'Você não tem permissão para fazer isso.'
    case 'PGRST116':
      return 'Registro não encontrado. Ele pode ter sido apagado.'
    default:
      return 'Não foi possível salvar. Verifique a conexão e tente de novo.'
  }
}
