/**
 * Couche « protocole » : une Action venue d'un joueur → validation → moteur → enchaînement automatique
 * (début de tour, victoire, minuteurs). C'est la seule porte d'entrée utilisée par le serveur.
 */
import type { GameState } from './types.ts'
import {
  type Ctx, type Res, defaultCtx, ok, fail,
  currentPlayer, getPlayer, drawCards, gainCoins, playCard, respondToAttack, useShipPower,
  resolveScry, buyShopItem, endTurn, startTurn, forfeit, expireReactions, isFinished, evaluateVictory, discardCard
} from './engine.ts'

export type Action =
  | { type: 'draw' }
  | { type: 'coins' }
  | { type: 'play'; cardId: string; targetId?: string; targetIds?: string[] }
  | { type: 'react'; defenseCardId?: string; dodge?: boolean }
  | { type: 'power'; cardId?: string; targetId?: string }
  | { type: 'scry'; keep: boolean }
  | { type: 'buy'; itemId: string; targetId?: string }
  | { type: 'discard'; cardId: string }
  | { type: 'end'; discardIds?: string[] }
  | { type: 'chat'; key: string }
  | { type: 'poke' }
  | { type: 'forfeit' }

/** Réactions rapides autorisées dans le salon (emojis + phrases pour le bluff). */
export const CHAT_PRESETS = ['👍', '😹', '😱', '🏴‍☠️', '🤔', '🔪', '🙏', '⚓', 'traitor', 'gg', 'hurry', 'innocent'] as const

const MAX_IDLE_STRIKES = 3

/** Enchaîne ce qui se déclenche tout seul : victoire, puis début du tour suivant. */
export function advance(state: GameState, ctx: Ctx) {
  evaluateVictory(state)
  if (state.phase === 'event') {
    startTurn(state, ctx)
    evaluateVictory(state)
  }
}

/** Fait avancer les minuteurs : réaction en retard, tour en retard. Renvoie true si l'état a changé. */
export function processTimers(state: GameState, ctx: Ctx): boolean {
  if (state.phase === 'finished' || state.phase === 'lobby') return false
  let changed = false

  if (state.pending?.kind === 'attack' && expireReactions(state, ctx)) changed = true

  const late = state.turnDeadline !== undefined && ctx.now >= state.turnDeadline
  if (late && state.pending?.kind !== 'attack') {
    const p = currentPlayer(state)
    if (p) {
      p.idleStrikes = (p.idleStrikes ?? 0) + 1
      state.log.push(`${p.name} a pris trop de temps.`)
      if (p.idleStrikes >= MAX_IDLE_STRIKES) {
        forfeit(state, p.id, ctx)
      } else {
        if (state.pending?.kind === 'scry') resolveScry(state, p.id, true)
        if (state.phase === 'draw') gainCoins(state, p.id, ctx)
        if (state.phase === 'action') endTurn(state, ctx)
      }
      changed = true
    }
  }
  if (changed) advance(state, ctx)
  return changed
}

export function applyAction(state: GameState, playerId: string, action: Action, ctx: Ctx = defaultCtx()): Res {
  const me = getPlayer(state, playerId)
  if (!me) return fail('Tu ne fais pas partie de cette partie.')

  if (action.type === 'chat') {
    if (!(CHAT_PRESETS as readonly string[]).includes(action.key)) return fail('Message inconnu.')
    state.chat.push({ id: (state.chat.at(-1)?.id ?? 0) + 1, playerId, key: action.key })
    if (state.chat.length > 40) state.chat.shift()
    return ok()
  }

  if (action.type === 'poke') {
    processTimers(state, ctx)
    return ok()
  }

  if (state.phase === 'finished') return fail('La partie est terminée.')
  if (!me.isAlive) return fail('Tu es éliminé.')

  // Un retard éventuel est réglé avant d'appliquer l'action, pour rester équitable.
  processTimers(state, ctx)
  if (isFinished(state)) return fail('La partie est terminée.')

  let res: Res
  const pending = state.pending
  if (pending?.kind === 'scry' && action.type !== 'scry' && action.type !== 'forfeit') {
    res = fail('Décide d\'abord du sort de la carte.')
  } else {
    switch (action.type) {
      case 'draw': res = drawCards(state, playerId, ctx); break
      case 'coins': res = gainCoins(state, playerId, ctx); break
      case 'discard': res = discardCard(state, playerId, action.cardId); break
      case 'play': res = playCard(state, playerId, action.cardId, { targetId: action.targetId, targetIds: action.targetIds }, ctx); break
      case 'react': res = respondToAttack(state, playerId, { defenseCardId: action.defenseCardId, dodge: action.dodge }, ctx); break
      case 'power': res = useShipPower(state, playerId, { cardId: action.cardId, targetId: action.targetId }, ctx); break
      case 'scry': res = resolveScry(state, playerId, action.keep); break
      case 'buy': res = buyShopItem(state, playerId, action.itemId, { targetId: action.targetId }, ctx); break
      case 'end':
        if (currentPlayer(state)?.id !== playerId) res = fail('Ce n\'est pas ton tour.')
        else if (state.phase === 'draw') res = fail('Pioche ou prends des pièces d\'abord.')
        else if (state.phase !== 'action' || state.pending) res = fail('Tu ne peux pas finir ton tour maintenant.')
        else { endTurn(state, ctx, action.discardIds ?? []); res = ok() }
        break
      case 'forfeit': forfeit(state, playerId, ctx); res = ok(); break
      default: res = fail('Action inconnue.')
    }
  }

  if (res.ok) {
    // Le joueur actif s'est manifesté : on remet son compteur d'inactivité à zéro.
    if (action.type !== 'forfeit' && currentPlayer(state)?.id === playerId) me.idleStrikes = 0
    advance(state, ctx)
  }
  return res
}
