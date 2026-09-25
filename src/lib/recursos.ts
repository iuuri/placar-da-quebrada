// Recursos do aparelho usados na beira do campo. Todos são opcionais: se o navegador não
// suportar, o timer continua funcionando normalmente.

let audio: AudioContext | null = null

// Precisa ser chamado num clique (navegadores só liberam som após interação).
export function prepararSom() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

// Três apitos curtos + vibração: fim do tempo.
export function apitar() {
  try {
    navigator.vibrate?.([400, 150, 400, 150, 800])
  } catch {
    // sem vibração
  }
  if (!audio) return
  const inicio = audio.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = audio.createOscillator()
    const vol = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = 1100
    vol.gain.value = 0.15
    osc.connect(vol).connect(audio.destination)
    osc.start(inicio + i * 0.45)
    osc.stop(inicio + i * 0.45 + (i === 2 ? 0.7 : 0.25))
  }
}

// Mantém a tela acesa enquanto o tempo corre.
export async function manterTelaAcesa(): Promise<() => void> {
  try {
    const trava = await navigator.wakeLock?.request('screen')
    return () => void trava?.release().catch(() => {})
  } catch {
    return () => {}
  }
}
