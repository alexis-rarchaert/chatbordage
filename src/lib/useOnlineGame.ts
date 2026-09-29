import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { Action, GameView, LobbyView } from '../game'
import {
  STORAGE, type RoomView, type CallResult, callGame, ensureSession, safeGet, safeSet, sendAction, watchView
} from './online'

const POLL_MS = 4000

/** État réactif d'une partie en ligne : session, salon, vue courante, minuteurs, notifications. */
export function useOnlineGame() {
  const userId = ref<string | null>(null)
  const roomCode = ref<string>(safeGet(STORAGE.room) ?? '')
  const view = shallowRef<RoomView | null>(null)
  const booting = ref(true)
  const busy = ref(false)
  const error = ref('')
  const realtimeUp = ref(false)
  const clockOffset = ref(0)
  const now = ref(Date.now())

  let stopWatch: (() => void) | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let tickTimer: ReturnType<typeof setInterval> | null = null

  const lobby = computed(() => (view.value?.status === 'lobby' ? (view.value as LobbyView) : null))
  const game = computed(() => (view.value && view.value.status !== 'lobby' ? (view.value as GameView) : null))
  /** Heure serveur estimée (compense l'horloge du téléphone). */
  const serverNow = computed(() => now.value + clockOffset.value)

  function setRoom(code: string) {
    roomCode.value = code
    safeSet(STORAGE.room, code || null)
  }

  function accept(next: RoomView) {
    const cur = view.value
    if (cur && (next.version ?? 0) < (cur.version ?? 0)) return // vue périmée
    if (next.status !== 'lobby') clockOffset.value = next.serverNow - Date.now()
    view.value = next
  }

  function handle(res: CallResult): res is Extract<CallResult, { ok: true }> {
    if (!res.ok) { error.value = res.error; return false }
    error.value = ''
    if (res.view) accept(res.view)
    if (res.roomCode) setRoom(res.roomCode)
    return true
  }

  async function run(fn: () => Promise<CallResult>): Promise<boolean> {
    if (busy.value) return false
    busy.value = true
    try { return handle(await fn()) } catch { error.value = 'network'; return false } finally { busy.value = false }
  }

  async function sync() {
    if (!roomCode.value || busy.value) return
    try {
      const res = await callGame({ op: 'sync', roomCode: roomCode.value })
      if (res.ok) accept(res.view!)
      else if (/introuvable|ne fais pas partie/i.test(res.error)) leaveLocal()
    } catch { /* réseau instable : le prochain sondage réessaiera */ }
  }

  function leaveLocal() {
    view.value = null
    setRoom('')
  }

  async function boot() {
    try {
      userId.value = await ensureSession()
      stopWatch = watchView(userId.value, accept, up => { realtimeUp.value = up })
      if (roomCode.value) await sync()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'network'
    } finally {
      booting.value = false
    }
    pollTimer = setInterval(sync, POLL_MS)
    tickTimer = setInterval(() => { now.value = Date.now() }, 500)
  }

  onBeforeUnmount(() => {
    stopWatch?.()
    if (pollTimer) clearInterval(pollTimer)
    if (tickTimer) clearInterval(tickTimer)
  })

  // ----- opérations de salon -----
  const create = (name: string, settings?: Record<string, number>) => {
    view.value = null
    return run(() => callGame({ op: 'create', name, settings }))
  }
  const join = (code: string, name: string) => {
    view.value = null
    return run(() => callGame({ op: 'join', roomCode: code.trim().toUpperCase(), name }))
  }
  const seat = (patch: { shipId?: string | null; ready?: boolean }) =>
    run(() => callGame({ op: 'seat', roomCode: roomCode.value, ...patch }))
  const settings = (s: Record<string, number>) => run(() => callGame({ op: 'settings', roomCode: roomCode.value, settings: s }))
  const kick = (targetId: string) => run(() => callGame({ op: 'kick', roomCode: roomCode.value, targetId }))
  const start = () => run(() => callGame({ op: 'start', roomCode: roomCode.value }))
  async function leave() {
    const code = roomCode.value
    leaveLocal()
    try { await callGame({ op: 'leave', roomCode: code }) } catch { /* déjà parti côté client */ }
  }
  const act = (action: Action) => run(() => sendAction(roomCode.value, action))
  const chat = (text: string) => callGame({ op: 'chat', roomCode: roomCode.value, text }).then(handle)
  const rematch = () => run(() => callGame({ op: 'rematch', roomCode: roomCode.value }))
  const sit = () => run(() => callGame({ op: 'sit', roomCode: roomCode.value }))

  // ----- notifications de tour -----
  const myTurn = computed(() => !!game.value && !game.value.isSpectator && game.value.status === 'playing' && game.value.currentPlayerId === game.value.youId && !game.value.pending)
  const mustReact = computed(() => game.value?.pending?.kind === 'attack' && game.value.pending.youMustRespond)
  const baseTitle = document.title
  watch([myTurn, mustReact], ([turn, react], [prevTurn, prevReact]) => {
    if ((turn && !prevTurn) || (react && !prevReact)) {
      try { navigator.vibrate?.(react ? [120, 60, 120] : 200) } catch { /* non supporté */ }
      if (document.hidden) {
        document.title = react ? '⚔️ Attaque !' : '⚓ À toi de jouer !'
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ChatBordage', { body: react ? 'Tu es attaqué !' : 'À toi de jouer !', icon: '/favicon.png' })
          }
        } catch { /* ignoré */ }
      }
    }
  })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) document.title = baseTitle })

  return {
    userId, roomCode, view, lobby, game, booting, busy, error, realtimeUp, serverNow,
    boot, create, join, seat, settings, kick, start, leave, act, chat, rematch, sit, sync, leaveLocal
  }
}
