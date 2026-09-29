/**
 * Salon d'attente : logique pure (sans réseau) manipulée par l'Edge Function.
 */
import type { GameState, RoomChatMessage, Spectator } from './types.ts'
import { SHIPS } from './ships.ts'
import { MIN_PLAYERS, MAX_PLAYERS } from './roles.ts'
import { type Ctx, type Res, defaultCtx, ok, fail, setupGame, forfeit } from './engine.ts'
import { advance } from './actions.ts'
import { type GameView, buildGameView } from './view.ts'

export interface Seat {
  userId: string
  name: string
  shipId: string | null
  ready: boolean
}

export interface RoomSettings {
  turnSeconds: number
  reactionSeconds: number
}

export interface Room {
  code: string
  hostId: string
  status: 'lobby' | 'playing' | 'finished'
  seats: Seat[]
  settings: RoomSettings
  state: GameState | null
  spectators: Spectator[]
  chat: RoomChatMessage[]
}

export const DEFAULT_SETTINGS: RoomSettings = { turnSeconds: 90, reactionSeconds: 20 }
export const NAME_MAX = 16
export const MAX_SPECTATORS = 12

export interface LobbyView {
  status: 'lobby'
  roomCode: string
  youId: string
  hostId: string
  isSpectator: boolean
  spectators: string[]
  roomChat: RoomChatMessage[]
  seats: Seat[]
  settings: RoomSettings
  minPlayers: number
  maxPlayers: number
}

export type RoomView = LobbyView | GameView

export function cleanName(raw: unknown): string {
  return String(raw ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, NAME_MAX)
}

export function newRoom(code: string, hostId: string, hostName: string, settings: Partial<RoomSettings> = {}): Room {
  return {
    code,
    hostId,
    status: 'lobby',
    seats: [{ userId: hostId, name: hostName, shipId: null, ready: false }],
    settings: sanitizeSettings(settings),
    state: null,
    spectators: [],
    chat: []
  }
}

export function sanitizeSettings(s: Partial<RoomSettings>): RoomSettings {
  const clamp = (v: unknown, min: number, max: number, dflt: number) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return dflt
    return n === 0 ? 0 : Math.min(max, Math.max(min, Math.round(n)))
  }
  return {
    turnSeconds: clamp(s.turnSeconds, 30, 300, DEFAULT_SETTINGS.turnSeconds),
    reactionSeconds: clamp(s.reactionSeconds, 10, 60, DEFAULT_SETTINGS.reactionSeconds)
  }
}

const isSeated = (room: Room, userId: string) => room.seats.some(s => s.userId === userId)
const isSpectator = (room: Room, userId: string) => room.spectators.some(s => s.userId === userId)
const nameTaken = (room: Room, name: string) =>
  [...room.seats, ...room.spectators].some(s => s.name.toLowerCase() === name.toLowerCase())

/**
 * Rejoindre un salon. Si la partie a déjà commencé (ou si le navire est plein), on devient spectateur :
 * le joueur regarde la partie et peut discuter, sans voir aucune information cachée.
 */
export function joinRoom(room: Room, userId: string, rawName: string): Res {
  if (isSeated(room, userId) || isSpectator(room, userId)) return ok() // reconnexion
  const name = cleanName(rawName)
  if (!name) return fail('Choisis un pseudo.')
  if (nameTaken(room, name)) return fail('Ce pseudo est déjà pris dans ce salon.')
  if (room.status === 'lobby' && room.seats.length < MAX_PLAYERS) {
    room.seats.push({ userId, name, shipId: null, ready: false })
  } else {
    if (room.spectators.length >= MAX_SPECTATORS) return fail('Le salon est complet, même pour les spectateurs.')
    room.spectators.push({ userId, name })
  }
  return ok()
}

/** Un spectateur prend une place libre quand le salon est en attente. */
export function sitDown(room: Room, userId: string): Res {
  const spec = room.spectators.find(s => s.userId === userId)
  if (!spec) return fail('Tu n\'es pas spectateur.')
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  if (room.seats.length >= MAX_PLAYERS) return fail('Le navire est plein.')
  room.spectators = room.spectators.filter(s => s.userId !== userId)
  room.seats.push({ userId, name: spec.name, shipId: null, ready: false })
  return ok()
}

/** Quitter le salon, quel que soit son état et son rôle (joueur, spectateur). */
export function leaveRoom(room: Room, userId: string, ctx: Ctx = defaultCtx()): Res {
  if (isSpectator(room, userId)) {
    room.spectators = room.spectators.filter(s => s.userId !== userId)
    return ok()
  }
  if (!isSeated(room, userId)) return fail('Tu n\'es pas dans ce salon.')
  if (room.status === 'playing' && room.state) {
    // En pleine partie : abandon (il reste dans la liste pour l'historique, mais est retiré du jeu).
    forfeit(room.state, userId, ctx)
    advance(room.state, ctx)
    return ok()
  }
  room.seats = room.seats.filter(s => s.userId !== userId)
  if (room.hostId === userId && room.seats[0]) room.hostId = room.seats[0].userId
  return ok()
}

const CHAT_MAX_LEN = 200
const CHAT_KEEP = 60
const CHAT_MIN_GAP_MS = 1000

/** Chat libre : joueurs et spectateurs. Limité en longueur et en fréquence. */
export function postChat(room: Room, userId: string, rawText: unknown, ctx: Ctx = defaultCtx()): Res {
  const who = room.seats.find(s => s.userId === userId) ?? room.spectators.find(s => s.userId === userId)
  if (!who) return fail('Tu n\'es pas dans ce salon.')
  const text = String(rawText ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LEN)
  if (!text) return fail('Message vide.')
  const last = [...room.chat].reverse().find(m => m.userId === userId)
  if (last && ctx.now - last.ts < CHAT_MIN_GAP_MS) return fail('slow_down')
  room.chat.push({ id: (room.chat.at(-1)?.id ?? 0) + 1, userId, name: who.name, text, ts: ctx.now })
  if (room.chat.length > CHAT_KEEP) room.chat.splice(0, room.chat.length - CHAT_KEEP)
  return ok()
}

/** Revanche : la partie terminée redevient un salon d'attente avec les mêmes joueurs. */
export function startRematch(room: Room, userId: string): Res {
  if (room.status !== 'finished') return fail('La partie n\'est pas terminée.')
  if (!isSeated(room, userId)) return fail('Seuls les joueurs peuvent lancer une revanche.')
  room.status = 'lobby'
  room.state = null
  // On garde les navires choisis ; chacun doit se déclarer prêt à nouveau.
  room.seats.forEach(s => { s.ready = false })
  if (!isSeated(room, room.hostId)) room.hostId = room.seats[0]!.userId
  return ok()
}

export function updateSeat(room: Room, userId: string, patch: { shipId?: string | null; ready?: boolean }): Res {
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  const seat = room.seats.find(s => s.userId === userId)
  if (!seat) return fail('Tu n\'es pas dans ce salon.')
  if (patch.shipId !== undefined) {
    if (patch.shipId !== null) {
      if (!SHIPS.some(s => s.id === patch.shipId)) return fail('Navire inconnu.')
      if (room.seats.some(s => s.userId !== userId && s.shipId === patch.shipId)) return fail('Navire déjà pris !')
    }
    seat.shipId = patch.shipId
  }
  if (patch.ready !== undefined) seat.ready = patch.ready
  return ok()
}

export function updateSettings(room: Room, userId: string, settings: Partial<RoomSettings>): Res {
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  if (userId !== room.hostId) return fail('Seul l\'hôte peut régler la partie.')
  room.settings = sanitizeSettings({ ...room.settings, ...settings })
  return ok()
}

/** Quitter le salon (avant le début) ou abandonner (partie en cours, géré par l'appelant via forfeit). */
export function leaveLobby(room: Room, userId: string): Res {
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  room.seats = room.seats.filter(s => s.userId !== userId)
  if (room.hostId === userId && room.seats[0]) room.hostId = room.seats[0].userId
  return ok()
}

export function kickFromLobby(room: Room, hostId: string, targetId: string): Res {
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  if (hostId !== room.hostId) return fail('Seul l\'hôte peut exclure un joueur.')
  if (targetId === hostId) return fail('Tu ne peux pas t\'exclure toi-même.')
  room.seats = room.seats.filter(s => s.userId !== targetId)
  return ok()
}

export function startRoom(room: Room, userId: string, ctx: Ctx = defaultCtx()): Res {
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  if (userId !== room.hostId) return fail('Seul l\'hôte peut lancer la partie.')
  if (room.seats.length < MIN_PLAYERS) return fail(`Il faut au moins ${MIN_PLAYERS} joueurs.`)
  if (room.seats.some(s => s.userId !== room.hostId && !s.ready)) return fail('Tout le monde n\'est pas prêt.')

  const state = setupGame({
    playerNames: room.seats.map(s => s.name),
    playerIds: room.seats.map(s => s.userId),
    shipIds: room.seats.map(s => s.shipId),
    rand: ctx.rand,
    turnSeconds: room.settings.turnSeconds,
    reactionSeconds: room.settings.reactionSeconds
  })
  advance(state, ctx) // premier événement de mer, distribution du tour
  room.state = state
  room.status = 'playing'
  return ok()
}

export function viewForUser(room: Room, userId: string, ctx: Ctx = defaultCtx()): RoomView | null {
  const seated = isSeated(room, userId)
  const spectating = isSpectator(room, userId)
  if (!seated && !spectating) return null
  const extras = {
    isSpectator: spectating,
    spectators: room.spectators.map(s => s.name),
    roomChat: room.chat.slice(-50)
  }
  if (room.state) return { ...buildGameView(room.state, userId, ctx.now), ...extras }
  return {
    status: 'lobby',
    roomCode: room.code,
    youId: userId,
    hostId: room.hostId,
    seats: room.seats,
    settings: room.settings,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    ...extras
  }
}
