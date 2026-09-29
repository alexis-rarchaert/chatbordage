/**
 * Effets sonores du jeu en ligne, synthétisés avec WebAudio : aucun fichier à charger.
 * Le navigateur n'autorise le son qu'après un geste de l'utilisateur ; `unlockAudio` est appelé au premier toucher.
 */
import { ref } from 'vue'

export type Sfx =
  | 'tap' | 'draw' | 'play' | 'hit' | 'heal' | 'coin' | 'turn' | 'alarm' | 'attack' | 'block'
  | 'event' | 'sink' | 'victory' | 'defeat' | 'chat' | 'join'

const KEY = 'chatbordage.muted'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
export const muted = ref(read())

export function setMuted(v: boolean) {
  muted.value = v
  try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* stockage indisponible */ }
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

export function unlockAudio() {
  const c = audio()
  if (c && c.state === 'suspended') void c.resume()
}

type Tone = { f: number; t?: number; d: number; type?: OscillatorType; v?: number; slide?: number }

function tones(list: Tone[]) {
  const c = audio()
  if (!c || c.state !== 'running') return
  const t0 = c.currentTime + 0.01
  for (const n of list) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const start = t0 + (n.t ?? 0)
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.f, start)
    if (n.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, n.slide), start + n.d)
    const vol = n.v ?? 0.18
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d)
    osc.connect(gain).connect(c.destination)
    osc.start(start)
    osc.stop(start + n.d + 0.05)
  }
}

/** Bruit blanc filtré (froissement de carte, choc). */
function noise(d: number, freq: number, v = 0.2, t = 0) {
  const c = audio()
  if (!c || c.state !== 'running') return
  const len = Math.floor(c.sampleRate * d)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  filter.type = 'lowpass'
  filter.frequency.value = freq
  gain.gain.value = v
  src.buffer = buf
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(c.currentTime + 0.01 + t)
}

const SOUNDS: Record<Sfx, () => void> = {
  tap: () => tones([{ f: 620, d: 0.06, type: 'triangle', v: 0.08 }]),
  draw: () => noise(0.09, 3500, 0.12),
  play: () => { noise(0.12, 1800, 0.14); tones([{ f: 330, d: 0.1, type: 'triangle', v: 0.07 }]) },
  hit: () => { noise(0.22, 700, 0.35); tones([{ f: 140, slide: 50, d: 0.25, type: 'sawtooth', v: 0.25 }]) },
  heal: () => tones([{ f: 523, d: 0.12, v: 0.12 }, { f: 659, t: 0.08, d: 0.12, v: 0.12 }, { f: 784, t: 0.16, d: 0.2, v: 0.12 }]),
  coin: () => tones([{ f: 988, d: 0.07, type: 'square', v: 0.07 }, { f: 1319, t: 0.07, d: 0.18, type: 'square', v: 0.07 }]),
  turn: () => tones([{ f: 880, d: 0.35, v: 0.14 }, { f: 1175, t: 0.12, d: 0.45, v: 0.12 }]),
  alarm: () => tones([{ f: 740, d: 0.14, type: 'square', v: 0.11 }, { f: 520, t: 0.16, d: 0.14, type: 'square', v: 0.11 }, { f: 740, t: 0.32, d: 0.14, type: 'square', v: 0.11 }]),
  attack: () => { noise(0.3, 500, 0.3); tones([{ f: 90, slide: 40, d: 0.3, type: 'sawtooth', v: 0.22 }]) },
  block: () => tones([{ f: 1500, d: 0.05, type: 'square', v: 0.09 }, { f: 2100, t: 0.04, d: 0.12, type: 'triangle', v: 0.1 }]),
  event: () => { noise(0.5, 900, 0.1); tones([{ f: 260, slide: 380, d: 0.45, v: 0.08 }]) },
  sink: () => tones([{ f: 300, slide: 60, d: 0.7, type: 'triangle', v: 0.2 }]),
  victory: () => tones([
    { f: 523, d: 0.16, type: 'triangle' }, { f: 659, t: 0.16, d: 0.16, type: 'triangle' },
    { f: 784, t: 0.32, d: 0.16, type: 'triangle' }, { f: 1047, t: 0.48, d: 0.55, type: 'triangle' }
  ]),
  defeat: () => tones([
    { f: 392, d: 0.25, type: 'triangle' }, { f: 330, t: 0.25, d: 0.25, type: 'triangle' },
    { f: 262, t: 0.5, d: 0.6, type: 'triangle' }
  ]),
  chat: () => tones([{ f: 760, d: 0.08, v: 0.07 }]),
  join: () => tones([{ f: 440, d: 0.08, v: 0.09 }, { f: 660, t: 0.07, d: 0.12, v: 0.09 }])
}

export function play(name: Sfx) {
  if (muted.value) return
  try { SOUNDS[name]() } catch { /* le son ne doit jamais casser le jeu */ }
}
