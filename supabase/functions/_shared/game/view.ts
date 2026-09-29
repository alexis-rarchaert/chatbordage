/**
 * Vue filtrée d'une partie pour UN joueur : c'est tout ce que le serveur lui envoie.
 * Les rôles cachés, les mains adverses et les notes privées des autres n'en font jamais partie.
 */
import type { Card, ChatMessage, GameState, PlayerState, RoleId, SeaEvent, ShopItem } from './types.ts'
import { blockingCards, canReact } from './engine.ts'

export interface PublicPlayer {
  id: string
  name: string
  shipId: string
  hp: number
  maxHp: number
  coins: number
  isAlive: boolean
  handCount: number
  permanents: Card[]
  eliminationsCount: number
  truceTurnsLeft: number
  powerUsedThisGame: boolean
  /** Renseigné seulement si le rôle est public (Capitaine), à toi, ou en fin de partie. */
  roleId: RoleId | null
}

export interface PendingAttackView {
  kind: 'attack'
  attackerId: string
  card: Card
  targetIds: string[]
  respondedIds: string[]
  deadline: number
  /** Ce joueur doit-il encore répondre, et avec quoi ? */
  youMustRespond: boolean
  yourBlockers: Card[]
  youCanDodge: boolean
}

export interface PendingScryView {
  kind: 'scry'
  playerId: string
  topCard: Card | null
}

export interface GameView {
  status: 'playing' | 'finished'
  id: string
  youId: string
  you: {
    hand: Card[]
    roleId: RoleId
    coins: number
    buffNextAttack: number
    revivePending: boolean
    powerUsedThisTurn: boolean
    noAttackThisTurn: boolean
    notes: string[]
  }
  players: PublicPlayer[]
  currentPlayerId: string
  phase: GameState['phase']
  event: SeaEvent | null
  turnNumber: number
  deckCount: number
  discardCount: number
  discardTop: Card | null
  shop: ShopItem[]
  pending: PendingAttackView | PendingScryView | null
  log: string[]
  chat: ChatMessage[]
  winnerIds: string[]
  turnDeadline: number | null
  serverNow: number
}

function publicPlayer(p: PlayerState, viewerId: string, finished: boolean): PublicPlayer {
  const roleVisible = p.roleId === 'capitaine' || p.id === viewerId || finished
  return {
    id: p.id,
    name: p.name,
    shipId: p.shipId,
    hp: p.hp,
    maxHp: p.maxHp,
    coins: p.coins,
    isAlive: p.isAlive,
    handCount: p.hand.length,
    permanents: p.permanents,
    eliminationsCount: p.eliminationsCount,
    truceTurnsLeft: p.truceTurnsLeft ?? 0,
    powerUsedThisGame: !!p.powerUsedThisGame,
    roleId: roleVisible ? p.roleId : null
  }
}

export function buildGameView(state: GameState, viewerId: string, now: number = Date.now()): GameView {
  const me = state.players.find(p => p.id === viewerId)!
  const finished = state.phase === 'finished'

  let pending: GameView['pending'] = null
  const pd = state.pending
  if (pd?.kind === 'attack') {
    const mustRespond = pd.targetIds.includes(viewerId) && !pd.responses[viewerId]
    pending = {
      kind: 'attack',
      attackerId: pd.attackerId,
      card: pd.card,
      targetIds: pd.targetIds,
      respondedIds: Object.keys(pd.responses),
      deadline: pd.deadline,
      youMustRespond: mustRespond && canReact(me, pd.card),
      yourBlockers: mustRespond && pd.card.effect !== 'PIERCE' ? blockingCards(me) : [],
      youCanDodge: mustRespond && me.shipId === 'corvette' && !me.powerUsedThisGame
    }
  } else if (pd?.kind === 'scry') {
    pending = { kind: 'scry', playerId: pd.playerId, topCard: pd.playerId === viewerId ? state.deck[0] ?? null : null }
  }

  return {
    status: finished ? 'finished' : 'playing',
    id: state.id,
    youId: viewerId,
    you: {
      hand: me.hand,
      roleId: me.roleId,
      coins: me.coins,
      buffNextAttack: me.buffNextAttack ?? 0,
      revivePending: !!me.revivePending,
      powerUsedThisTurn: !!me.powerUsedThisTurn,
      noAttackThisTurn: !!me.noAttackThisTurn,
      notes: (state.notes[viewerId] ?? []).slice(-15)
    },
    players: state.players.map(p => publicPlayer(p, viewerId, finished)),
    currentPlayerId: state.players[state.currentPlayerIndex]!.id,
    phase: state.phase,
    event: state.currentEvent ?? null,
    turnNumber: state.turnNumber,
    deckCount: state.deck.length,
    discardCount: state.discard.length,
    discardTop: state.discard.at(-1) ?? null,
    shop: state.shop,
    pending,
    log: state.log.slice(-60),
    chat: state.chat.slice(-30),
    winnerIds: state.winnerIds ?? [],
    turnDeadline: state.turnDeadline ?? null,
    serverNow: now
  }
}
