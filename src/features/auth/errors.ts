// Traduz erros do Supabase Auth para mensagens da interface.
export function mensagemErroAuth(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.'
    case 'email_not_confirmed':
      return 'Este e-mail ainda não foi confirmado. Fale com o organizador.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
    case 'email_provider_disabled':
      return 'O login por e-mail está desligado no Supabase. O organizador precisa ativar em Authentication → Sign In / Providers → Email.'
    case 'same_password':
      return 'A nova senha precisa ser diferente da atual.'
    case 'weak_password':
      return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.'
    default:
      return 'Não foi possível completar a ação. Verifique a conexão e tente de novo.'
  }
}
