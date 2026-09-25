// Depois de um deploy, uma aba já aberta ainda aponta para os arquivos da versão antiga.
// Ao abrir uma tela carregada sob demanda, o arquivo antigo não existe mais e o import falha.
// Solução: recarregar a página uma vez para pegar a versão nova.

const CHAVE = 'pdq:recarregado-em'
const INTERVALO_MINIMO_MS = 30_000

export function recarregarParaNovaVersao(): boolean {
  let ultima = 0
  try {
    ultima = Number(sessionStorage.getItem(CHAVE) ?? 0)
  } catch {
    // sessionStorage indisponível (aba anônima restrita): recarrega mesmo assim
  }
  // Evita loop de recarga se o problema não for versão antiga (ex.: sem internet).
  if (Date.now() - ultima < INTERVALO_MINIMO_MS) return false
  try {
    sessionStorage.setItem(CHAVE, String(Date.now()))
  } catch {
    // ignora
  }
  window.location.reload()
  return true
}

export function ehErroDeVersaoAntiga(erro: unknown): boolean {
  const msg = erro instanceof Error ? erro.message : String(erro)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|MIME type/i.test(msg)
}

export function instalarRecargaAutomatica() {
  // Evento disparado pelo Vite quando um import dinâmico falha.
  window.addEventListener('vite:preloadError', (evento) => {
    if (recarregarParaNovaVersao()) evento.preventDefault()
  })
}
