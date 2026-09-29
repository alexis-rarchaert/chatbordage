/**
 * Salon d'attente : logique pure (sans réseau) manipulée par l'Edge Function.
 */
import type { GameState } from './types.ts'
import { SHIPS } from './ships.ts'
import { MIN_PLAYERS, MAX_PLAYERS } from './roles.ts'
import { type Ctx, type Res, defaultCtx, ok, fail, setupGame } from './engine.ts'
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
}

export const DEFAULT_SETTINGS: RoomSettings = { turnSeconds: 90, reactionSeconds: 20 }
export const NAME_MAX = 16

export interface LobbyView {
  status: 'lobby'
  roomCode: string
  youId: string
  hostId: string
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
    state: null
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

export function joinRoom(room: Room, userId: string, rawName: string): Res {
  if (room.seats.some(s => s.userId === userId)) return ok() // reconnexion
  if (room.status !== 'lobby') return fail('La partie a déjà commencé.')
  if (room.seats.length >= MAX_PLAYERS) return fail('Le navire est plein.')
  const name = cleanName(rawName)
  if (!name) return fail('Choisis un pseudo.')
  if (room.seats.some(s => s.name.toLowerCase() === name.toLowerCase())) return fail('Ce pseudo est déjà pris dans ce salon.')
  room.seats.push({ userId, name, shipId: null, ready: false })
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
  if (!room.seats.some(s => s.userId === userId)) return null
  if (room.state) return buildGameView(room.state, userId, ctx.now)
  return {
    status: 'lobby',
    roomCode: room.code,
    youId: userId,
    hostId: room.hostId,
    seats: room.seats,
    settings: room.settings,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS
  }
}
