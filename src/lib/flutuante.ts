import type { Estado } from '@/estado'
import { acabou, alemDoTempoMs, exibidoMs, formatar, restantePunicaoMs } from '@/tempo'

// Janela flutuante do cronômetro (picture-in-picture).
// O tempo é desenhado num canvas, que vira um "vídeo" ao vivo; esse vídeo abre em janela flutuante,
// que fica por cima de outros apps quando a pessoa minimiza o navegador.
// O desenho usa sempre Date.now() e o estado atual, então não depende da tela do React estar ativa.

export type TextosFlutuante = { tempo: string; placar: string; detalhe: string; alerta: boolean }

export function textosFlutuante(estado: Estado, agora: number): TextosFlutuante {
  const { timer, placar, punicoes } = estado
  const nomeA = placar.casa.nome || 'Time A'
  const nomeB = placar.visitante.nome || 'Time B'
  const fim = acabou(timer, agora)
  const alem = alemDoTempoMs(timer, agora)
  const ativas = punicoes.map((p) => restantePunicaoMs(p, timer, agora)).filter((ms) => ms > 0)

  let detalhe = timer.rodando ? '' : 'Pausado'
  if (fim) detalhe = 'Fim do tempo!'
  else if (timer.modo === 'regressivo' && timer.acrescimoSeg > 0) detalhe = `Acréscimo +${Math.round(timer.acrescimoSeg / 60)}'`
  else if (alem > 0) detalhe = `Acréscimo +${formatar(alem)}`
  if (ativas.length > 0) {
    const proxima = formatar(Math.min(...ativas), true)
    detalhe = [detalhe, `Punição ${proxima}${ativas.length > 1 ? ` (+${ativas.length - 1})` : ''}`].filter(Boolean).join(' · ')
  }
  // Jogo de 2 tempos: diz em qual está.
  if (estado.tempos === 2) detalhe = [`${estado.periodo}ºT`, detalhe].filter(Boolean).join(' · ')

  return {
    tempo: formatar(exibidoMs(timer, agora), timer.modo === 'regressivo'),
    placar: `${nomeA} ${placar.casa.gols} × ${placar.visitante.gols} ${nomeB}`,
    detalhe,
    alerta: fim,
  }
}

export function suportaFlutuante(): boolean {
  return (
    typeof document !== 'undefined' &&
    'pictureInPictureEnabled' in document &&
    document.pictureInPictureEnabled &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  )
}

const LARGURA = 480
const ALTURA = 270
const FONTE = "'Big Shoulders Display Variable', 'Arial Narrow', sans-serif"

function ajustarTexto(ctx: CanvasRenderingContext2D, texto: string, maxLargura: number, tamanho: number, peso: number, familia: string) {
  let t = tamanho
  do {
    ctx.font = `${peso} ${t}px ${familia}`
    if (ctx.measureText(texto).width <= maxLargura) break
    t -= 2
  } while (t > 12)
}

function desenhar(ctx: CanvasRenderingContext2D, t: TextosFlutuante) {
  ctx.fillStyle = t.alerta ? '#d62839' : '#14213d'
  ctx.fillRect(0, 0, LARGURA, ALTURA)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#ffc928'
  ajustarTexto(ctx, t.placar, LARGURA - 32, 30, 800, FONTE)
  ctx.fillText(t.placar, LARGURA / 2, 38)

  ctx.fillStyle = '#eef1f4'
  ajustarTexto(ctx, t.tempo, LARGURA - 32, 150, 900, FONTE)
  ctx.fillText(t.tempo, LARGURA / 2, 142)

  if (t.detalhe) {
    ctx.fillStyle = t.alerta ? '#ffffff' : '#ffc928'
    ajustarTexto(ctx, t.detalhe, LARGURA - 32, 28, 700, 'Atkinson Hyperlegible, system-ui, sans-serif')
    ctx.fillText(t.detalhe, LARGURA / 2, 234)
  }
}

// Abre a janela flutuante. Precisa ser chamada num toque (exigência do navegador).
// Devolve uma função que fecha a janela e libera os recursos.
export async function abrirFlutuante(lerEstado: () => Estado, onFechar: () => void): Promise<() => void> {
  await document.fonts?.load(`900 100px ${FONTE}`).catch(() => undefined)

  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('aria-hidden', 'true')
  // Fica fora da tela, mas no documento (alguns navegadores exigem isso para o PiP).
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px'
  document.body.append(video)

  const pintar = () => desenhar(ctx, textosFlutuante(lerEstado(), Date.now()))
  pintar()
  const stream = canvas.captureStream()
  video.srcObject = stream

  // setInterval (e não requestAnimationFrame): continua rodando com a página em segundo plano.
  const intervalo = window.setInterval(pintar, 250)

  const fechar = () => {
    if (document.pictureInPictureElement === video) void document.exitPictureInPicture().catch(() => undefined)
    liberar()
  }

  // Fecha sozinha quando a pessoa volta para a página depois de sair dela (minimizou, trocou de app ou de aba).
  // Abrir sozinha ao minimizar não é possível: o navegador só permite isso para conteúdo com som.
  let saiuDaPagina = false
  const aoMudarVisibilidade = () => {
    if (document.visibilityState === 'hidden') saiuDaPagina = true
    else if (saiuDaPagina) fechar()
  }
  document.addEventListener('visibilitychange', aoMudarVisibilidade)

  let fechado = false
  function liberar() {
    if (fechado) return
    fechado = true
    window.clearInterval(intervalo)
    document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    stream.getTracks().forEach((track) => track.stop())
    video.remove()
    onFechar()
  }
  video.addEventListener('leavepictureinpicture', liberar)

  try {
    await video.play()
    await video.requestPictureInPicture()
  } catch (erro) {
    liberar()
    throw erro
  }

  return fechar
}
