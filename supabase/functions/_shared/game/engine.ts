/**
 * Moteur de jeu ChatBordage — fonctions qui transforment un GameState.
 * Aucune dépendance UI ni réseau : utilisé à la fois par le navigateur et par l'Edge Function
 * `game`, qui fait autorité sur les parties en ligne.
 */
import type { AttackResponse, Card, GameState, PendingAttack, PlayerState, Ship } from './types.ts'
import { SHIPS, getShip } from './ships.ts'
import { ROLES, assignRoles, checkVictory, MIN_PLAYERS, MAX_PLAYERS } from './roles.ts'
import { freshDeck, shuffle } from './cards.ts'
import { drawSeaEvent } from './events.ts'
import { freshShop } from './shop.ts'

export type Ctx = { rand: () => number; now: number }
export const defaultCtx = (): Ctx => ({ rand: Math.random, now: Date.now() })

export type Res = { ok: true } | { ok: false; error: string }
export const isFinished = (s: GameState) => s.phase === 'finished'

/** Termine la partie si une mission est accomplie (ou si plus personne ne survit). */
export function evaluateVictory(state: GameState) {
  if (isFinished(state)) return
  const victory = checkVictory(state)
  if (victory) {
    state.phase = 'finished'
    state.pending = undefined
    state.turnDeadline = undefined
    state.winnerIds = victory.winners.map(w => w.id)
    state.log.push(`Victoire — ${victory.reason}`)
  } else if (!state.players.some(p => p.isAlive)) {
    state.phase = 'finished'
    state.pending = undefined
    state.turnDeadline = undefined
    state.winnerIds = []
    state.log.push('Tout l\'équipage a sombré : match nul.')
  }
}
export const ok = (): Res => ({ ok: true })
export const fail = (error: string): Res => ({ ok: false, error })

export type SetupOptions = {
  playerNames: string[]
  playerIds?: string[]                        // ids stables (ex. uuid Supabase) ; sinon p1, p2…
  shipIds?: (string | null | undefined)[]     // choix de navires ; les trous sont tirés au hasard
  rand?: () => number
  turnSeconds?: number
  reactionSeconds?: number
}

export function setupGame(opts: SetupOptions): GameState {
  const { playerNames, rand = Math.random, turnSeconds = 0, reactionSeconds = 20 } = opts
  const count = playerNames.length
  if (count < MIN_PLAYERS || count > MAX_PLAYERS) {
    throw new Error(`ChatBordage : ${MIN_PLAYERS} à ${MAX_PLAYERS} joueurs requis.`)
  }

  const roleIds = assignRoles(count, rand)

  // Navires : on respecte les choix uniques, puis on complète au hasard avec ce qui reste.
  const chosen: (Ship | undefined)[] = playerNames.map((_, i) => {
    const id = opts.shipIds?.[i]
    return id ? getShip(id) : undefined
  })
  const used = new Set(chosen.filter(Boolean).map(s => s!.id))
  const spare = shuffle(SHIPS.filter(s => !used.has(s.id)), rand)
  const ships: Ship[] = chosen.map(s => s ?? spare.shift()!)

  const deck = freshDeck(rand)

  const players: PlayerState[] = playerNames.map((name, i) => {
    const ship = ships[i]!
    const roleId = roleIds[i]!
    const role = ROLES.find(r => r.id === roleId)!
    const maxHp = ship.hp + role.startingHpBonus
    return {
      id: opts.playerIds?.[i] ?? `p${i + 1}`,
      name,
      shipId: ship.id,
      roleId,
      hp: maxHp,
      maxHp,
      hand: deck.splice(0, 3),
      permanents: [],
      coins: 0,
      isAlive: true,
      eliminationsCount: 0,
      idleStrikes: 0
    }
  })

  // Le Capitaine commence
  const capIdx = players.findIndex(p => p.roleId === 'capitaine')

  return {
    id: cryptoRandomId(),
    players,
    deck,
    discard: [],
    shop: freshShop(),
    events: [],
    currentPlayerIndex: capIdx >= 0 ? capIdx : 0,
    phase: 'event',
    hasPlayedAttack: false,
    log: [`Partie lancée — ${players.length} joueurs.`],
    notes: {},
    chat: [],
    turnNumber: 0,
    turnSeconds,
    reactionSeconds
  }
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `g_${Math.random().toString(36).slice(2)}`
}

// ============ OUTILS ============

export function currentPlayer(state: GameState): PlayerState | undefined {
  return state.players[state.currentPlayerIndex]
}

export function getPlayer(state: GameState, id: string): PlayerState | undefined {
  return state.players.find(p => p.id === id)
}

export function handMax(player: PlayerState): number {
  return player.shipId === 'galion' ? 6 : 5
}

/** Pioche n cartes ; si la pioche est vide, la défausse est mélangée pour la reconstituer. */
export function drawFromDeck(state: GameState, n: number, ctx: Ctx = defaultCtx()): Card[] {
  const out: Card[] = []
  while (out.length < n) {
    if (!state.deck.length) {
      if (!state.discard.length) break
      state.deck = shuffle(state.discard, ctx.rand)
      state.discard = []
      state.log.push('La pioche est reconstituée avec la défausse.')
    }
    out.push(state.deck.shift()!)
  }
  return out
}

/** Message visible uniquement par un joueur (résultat d'espionnage, etc.). */
export function addNote(state: GameState, playerId: string, text: string) {
  const list = (state.notes[playerId] ??= [])
  list.push(text)
  if (list.length > 30) list.shift()
}

export function livingPlayers(state: GameState): PlayerState[] {
  return state.players.filter(p => p.isAlive)
}

function armDeadline(state: GameState, ctx: Ctx) {
  state.turnDeadline = state.turnSeconds > 0 ? ctx.now + state.turnSeconds * 1000 : undefined
}

// ============ TOUR ============

export function startTurn(state: GameState, ctx: Ctx = defaultCtx()) {
  const player = currentPlayer(state)!
  const event = drawSeaEvent(ctx.rand)
  state.currentEvent = event
  state.events.push(event)
  state.phase = 'draw'
  state.hasPlayedAttack = false
  state.turnNumber += 1
  state.log.push(`Événement : ${event.name} — ${event.description}`)

  state.players.forEach(p => { p.powerUsedThisTurn = false; p.noAttackThisTurn = false })

  switch (event.id) {
    case 'tempete':
      state.players.forEach(p => { if (p.isAlive && p.hp > 1) p.hp -= 1 })
      break
    case 'tresor':
      state.players.forEach(p => { if (p.isAlive) p.coins += 1 })
      break
    case 'reflux':
      state.players.forEach(p => { if (p.isAlive) p.hp = Math.min(p.maxHp, p.hp + 1) })
      break
    case 'sirenes':
      // Adaptation jouable en ligne : les mains trop fournies (4+ cartes) défaussent 1 carte au hasard.
      for (const p of livingPlayers(state)) {
        if (p.hand.length >= 4) {
          const [drop] = p.hand.splice(Math.floor(ctx.rand() * p.hand.length), 1)
          state.discard.push(drop!)
          state.log.push(`Le chant des sirènes fait perdre une carte à ${p.name}.`)
        }
      }
      break
    case 'mutinerie': {
      const left = nextAlive(state, state.currentPlayerIndex)
      if (left !== state.currentPlayerIndex && player.hand.length) {
        const [gift] = player.hand.splice(Math.floor(ctx.rand() * player.hand.length), 1)
        state.players[left]!.hand.push(gift!)
        state.log.push(`Mutinerie : ${player.name} doit donner une carte à ${state.players[left]!.name}.`)
      }
      break
    }
  }

  // Lunette d'approche : coup d'œil privé sur la pioche
  if (player.permanents.some(c => c.effect === 'PERM_SCRY')) {
    const [top] = drawFromDeck(state, 1, ctx)
    if (top) {
      state.deck.unshift(top)
      addNote(state, player.id, `Lunette d'approche : la prochaine carte de la pioche est « ${top.name} ».`)
    }
  }

  armDeadline(state, ctx)
}

function nextAlive(state: GameState, from: number): number {
  let next = (from + 1) % state.players.length
  let guard = state.players.length
  while (!state.players[next]!.isAlive && guard-- > 0) next = (next + 1) % state.players.length
  return next
}

export function drawCards(state: GameState, playerId: string, ctx: Ctx = defaultCtx()): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if (state.phase !== 'draw') return fail('Tu as déjà pris tes ressources ce tour.')

  let toDraw = 2
  if (state.currentEvent?.id === 'vents') toDraw += 1

  const space = Math.max(0, handMax(player) - player.hand.length)
  const drawn = drawFromDeck(state, Math.min(toDraw, space), ctx)
  player.hand.push(...drawn)

  state.phase = 'action'
  state.log.push(`${player.name} pioche ${drawn.length} carte(s).`)
  caravelleBonus(state, player, ctx)
  return ok()
}

/** Caravelle : 1 carte gratuite chaque tour (dans la limite de la main), que le joueur pioche ou prenne des pièces. */
function caravelleBonus(state: GameState, player: PlayerState, ctx: Ctx) {
  if (player.shipId !== 'caravelle' || player.hand.length >= handMax(player)) return
  const drawn = drawFromDeck(state, 1, ctx)
  player.hand.push(...drawn)
  if (drawn.length) state.log.push(`${player.name} pioche 1 carte gratuite (Caravelle).`)
}

export function gainCoins(state: GameState, playerId: string, ctx: Ctx = defaultCtx()): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if (state.phase !== 'draw') return fail('Tu as déjà pris tes ressources ce tour.')
  const gain = 2 + (player.shipId === 'gabare' ? 1 : 0)
  player.coins += gain
  state.phase = 'action'
  state.log.push(`${player.name} prend ${gain} pièce(s).`)
  caravelleBonus(state, player, ctx)
  return ok()
}

/** Défausse volontaire d'une carte, à tout moment du tour (livret de règles). */
export function discardCard(state: GameState, playerId: string, cardId: string): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if ((state.phase !== 'draw' && state.phase !== 'action') || state.pending) return fail('Tu ne peux pas défausser maintenant.')
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return fail('Carte introuvable dans ta main.')
  const [card] = player.hand.splice(idx, 1)
  state.discard.push(card!)
  state.log.push(`${player.name} défausse une carte.`)
  return ok()
}

export type PlayOpts = { targetId?: string; targetIds?: string[] }

export function playCard(state: GameState, playerId: string, cardId: string, opts: PlayOpts = {}, ctx: Ctx = defaultCtx()): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if (state.phase !== 'action' || state.pending) return fail('Tu ne peux pas jouer de carte maintenant.')

  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return fail('Carte introuvable dans ta main.')
  const card = player.hand[idx]!

  // Les Rumeurs peuvent viser n'importe quel joueur vivant, soi-même compris (livret de règles).
  const target = opts.targetId ? state.players.find(p => p.id === opts.targetId && p.isAlive) : undefined

  // ----- validations avant de consommer la carte -----
  if (card.family === 'VOILE') return fail('Une Voile se joue en réaction à une attaque.')
  if (card.permanent && player.permanents.some(c => c.name === card.name)) return fail('Tu as déjà cet équipement en jeu.')
  if (card.family === 'ABORDAGE' && player.noAttackThisTurn) return fail('Tu ne peux pas attaquer ce tour (repos au port).')
  if (card.family === 'RUMEUR' && !target) return fail('Choisis une cible.')

  let attackTargets: string[] = []
  if (card.family === 'ABORDAGE') {
    attackTargets = pickAttackTargets(state, player, card, opts)
    if (!attackTargets.length) return fail('Cible invalide ou sous drapeau de trêve.')
  }

  player.hand.splice(idx, 1)

  // ----- Équipement -----
  if (card.permanent) {
    player.permanents.push(card)
    if (card.effect === 'PERM_MAXHP_1') { player.maxHp += 1; player.hp += 1 }
    state.log.push(`${player.name} équipe : ${card.name}.`)
    return ok()
  }

  // ----- Attaque : ouvre une fenêtre de réaction -----
  if (card.family === 'ABORDAGE') {
    startAttack(state, player, card, attackTargets, ctx)
    return ok()
  }

  // ----- Marées -----
  if (card.family === 'MAREE') {
    if (card.heal) {
      player.hp = Math.min(player.maxHp, player.hp + card.heal)
      state.log.push(`${player.name} joue ${card.name} et se soigne de ${card.heal}.`)
    }
    if (card.effect === 'DRAW_2') {
      const drawn = drawFromDeck(state, 2, ctx)
      player.hand.push(...drawn)
      state.log.push(`${player.name} joue ${card.name} et pioche ${drawn.length} carte(s).`)
    }
    if (card.effect === 'NO_ATTACK_TURN') player.noAttackThisTurn = true
    state.discard.push(card)
    return ok()
  }

  // ----- Trésor à usage unique -----
  if (card.family === 'TRESOR' && card.effect === 'COINS_4') {
    player.coins += 4
    state.log.push(`${player.name} ouvre un coffre : +4 pièces.`)
    state.discard.push(card)
    return ok()
  }

  // ----- Rumeurs -----
  if (card.family === 'RUMEUR' && target) {
    applyRumor(state, player, target, card, ctx)
    state.discard.push(card)
    return ok()
  }

  state.discard.push(card)
  return ok()
}

function applyRumor(state: GameState, player: PlayerState, target: PlayerState, card: Card, ctx: Ctx) {
  switch (card.effect) {
    case 'STEAL_CARD':
      if (target.hand.length) {
        const [stolen] = target.hand.splice(Math.floor(ctx.rand() * target.hand.length), 1)
        player.hand.push(stolen!)
        state.log.push(`${player.name} vole 1 carte à ${target.name}.`)
      } else state.log.push(`${player.name} tente de voler ${target.name}, mais sa main est vide.`)
      break
    case 'PEEK_HAND': {
      state.log.push(`${player.name} épie la main de ${target.name}.`)
      const names = target.hand.map(c => c.name).join(', ') || 'aucune carte'
      addNote(state, player.id, `Main de ${target.name} : ${names}.`)
      break
    }
    case 'PEEK_ROLE':
      state.log.push(`${player.name} murmure à l'oreille de ${target.name}…`)
      if (target.shipId === 'fantome') addNote(state, player.id, `Le Vaisseau Fantôme de ${target.name} brouille la révélation : rien à voir.`)
      else addNote(state, player.id, `${target.name} est ${roleName(target)}.`)
      break
    case 'SWAP_HAND': {
      const tmp = player.hand
      player.hand = target.hand
      target.hand = tmp
      state.log.push(`${player.name} échange sa main avec ${target.name}.`)
      break
    }
    case 'DISCARD_RANDOM':
      if (target.hand.length) {
        const [drop] = target.hand.splice(Math.floor(ctx.rand() * target.hand.length), 1)
        state.discard.push(drop!)
        state.log.push(`${target.name} défausse 1 carte (Pavillon noir).`)
      }
      break
    case 'STEAL_TREASURE': {
      const candidates = target.permanents.filter(c => !player.permanents.some(o => o.name === c.name))
      if (target.id === player.id || !candidates.length) {
        state.log.push(`${player.name} tente un pillage sur ${target.name}, sans rien à emporter.`)
        break
      }
      const loot = candidates[Math.floor(ctx.rand() * candidates.length)]!
      target.permanents = target.permanents.filter(c => c.id !== loot.id)
      player.permanents.push(loot)
      if (loot.effect === 'PERM_MAXHP_1') {
        target.maxHp = Math.max(1, target.maxHp - 1)
        target.hp = Math.min(target.hp, target.maxHp)
        player.maxHp += 1
        player.hp += 1
      }
      state.log.push(`${player.name} pille ${loot.name} chez ${target.name}.`)
      break
    }
    case 'DESTROY_TREASURE':
      if (target.shipId === 'trois-mats') {
        state.log.push(`Le Trois-Mâts protège les équipements de ${target.name}.`)
      } else if (target.permanents.length) {
        const drop = target.permanents.shift()!
        state.discard.push(drop)
        if (drop.effect === 'PERM_MAXHP_1') {
          target.maxHp = Math.max(1, target.maxHp - 1)
          target.hp = Math.min(target.hp, target.maxHp)
        }
        state.log.push(`${player.name} détruit ${drop.name} de ${target.name}.`)
      } else state.log.push(`${player.name} sabote ${target.name}, qui n'a aucun équipement.`)
      break
  }
}

function roleName(p: PlayerState): string {
  return ROLES.find(r => r.id === p.roleId)!.name
}

// ============ ATTAQUE & RÉACTIONS ============

function pickAttackTargets(state: GameState, attacker: PlayerState, card: Card, opts: PlayOpts): string[] {
  const alive = (id: string) => state.players.find(p => p.id === id && p.isAlive && p.id !== attacker.id)
  let ids: string[] = []
  if (card.effect === 'AOE') {
    ids = state.players.filter(p => p.isAlive && p.id !== attacker.id).map(p => p.id)
  } else if (card.effect === 'MULTI_2') {
    const wanted = [...new Set([...(opts.targetIds ?? []), ...(opts.targetId ? [opts.targetId] : [])])]
    ids = wanted.filter(alive).slice(0, 2)
  } else if (opts.targetId && alive(opts.targetId)) {
    ids = [opts.targetId]
  }
  // Drapeau de trêve : cible intouchable
  return ids.filter(id => !((getPlayer(state, id)?.truceTurnsLeft ?? 0) > 0))
}

function canDodge(p: PlayerState) {
  return p.shipId === 'corvette' && !p.powerUsedThisGame
}

export function blockingCards(p: PlayerState): Card[] {
  return p.hand.filter(c => c.family === 'VOILE')
}

/** Une cible a-t-elle une vraie décision à prendre ? Sinon on ne l'attend pas. */
export function canReact(p: PlayerState, card: Card): boolean {
  return canDodge(p) || (card.effect !== 'PIERCE' && blockingCards(p).length > 0)
}

function startAttack(state: GameState, attacker: PlayerState, card: Card, targetIds: string[], ctx: Ctx) {
  const pending: PendingAttack = {
    kind: 'attack',
    attackerId: attacker.id,
    card,
    targetIds,
    responses: {},
    deadline: ctx.now + state.reactionSeconds * 1000
  }
  // Ceux qui ne peuvent rien faire répondent d'office « rien ».
  for (const id of targetIds) if (!canReact(getPlayer(state, id)!, card)) pending.responses[id] = {}
  state.pending = pending
  state.phase = 'reaction'
  state.log.push(`${attacker.name} lance ${card.name} !`)
  if (allResponded(pending)) resolveAttack(state, ctx)
}

function allResponded(p: PendingAttack) {
  return p.targetIds.every(id => p.responses[id])
}

export function respondToAttack(state: GameState, playerId: string, response: AttackResponse, ctx: Ctx = defaultCtx()): Res {
  const pending = state.pending
  if (!pending || pending.kind !== 'attack' || state.phase !== 'reaction') return fail('Aucune attaque à laquelle réagir.')
  if (!pending.targetIds.includes(playerId)) return fail('Tu n\'es pas ciblé.')
  if (pending.responses[playerId]) return fail('Tu as déjà répondu.')
  const target = getPlayer(state, playerId)!

  const clean: AttackResponse = {}
  if (response.dodge) {
    if (!canDodge(target)) return fail('Tu ne peux pas esquiver.')
    clean.dodge = true
  } else if (response.defenseCardId) {
    if (pending.card.effect === 'PIERCE') return fail('Cette attaque ignore les Voiles.')
    const def = target.hand.find(c => c.id === response.defenseCardId)
    if (!def || def.family !== 'VOILE') return fail('Cette carte n\'est pas une Voile de ta main.')
    clean.defenseCardId = def.id
  }
  pending.responses[playerId] = clean
  if (allResponded(pending)) resolveAttack(state, ctx)
  return ok()
}

/** Les cibles muettes après le délai sont considérées comme n'ayant rien joué. */
export function expireReactions(state: GameState, ctx: Ctx) {
  const pending = state.pending
  if (!pending || pending.kind !== 'attack' || ctx.now < pending.deadline) return false
  for (const id of pending.targetIds) pending.responses[id] ??= {}
  resolveAttack(state, ctx)
  return true
}

function resolveAttack(state: GameState, ctx: Ctx) {
  const pending = state.pending
  if (!pending || pending.kind !== 'attack') return
  const attacker = getPlayer(state, pending.attackerId)!
  const card = pending.card
  const ship = getShip(attacker.shipId)!

  let dmg = (card.damage ?? 1) + (ship.damage - 1)
  if (attacker.permanents.some(p => p.effect === 'PERM_DMG_1')) dmg += 1
  if (attacker.buffNextAttack) { dmg += attacker.buffNextAttack; attacker.buffNextAttack = 0 }
  if (state.currentEvent?.id === 'brume') dmg = Math.max(1, dmg - 1)

  state.pending = undefined
  state.phase = 'action'
  state.log.push(`${card.name} : ${dmg} dégât(s) de base.`)

  const attacked: string[] = []
  for (const id of pending.targetIds) {
    if (isFinished(state)) break
    const target = getPlayer(state, id)!
    if (!target.isAlive) continue
    attacked.push(id)
    const response = pending.responses[id] ?? {}
    let dealt = dmg

    if (response.dodge && canDodge(target)) {
      target.powerUsedThisGame = true
      state.log.push(`${target.name} esquive complètement l'attaque (Corvette) !`)
      continue
    }

    if (attacker.shipId === 'felouque' && target.hp > attacker.hp) dealt += 1
    if (target.permanents.some(p => p.effect === 'PERM_ARMOR_FIRST')) dealt = Math.max(1, dealt - 1)
    if (target.shipId === 'cuirasse') dealt = Math.max(1, dealt - 1)

    if (response.defenseCardId && card.effect !== 'PIERCE') {
      const dIdx = target.hand.findIndex(c => c.id === response.defenseCardId && c.family === 'VOILE')
      if (dIdx !== -1) {
        const [defense] = target.hand.splice(dIdx, 1)
        state.discard.push(defense!)
        if (defense!.effect === 'BLOCK') {
          state.log.push(`${target.name} esquive avec ${defense!.name}.`)
          continue
        }
        if (defense!.effect === 'BLOCK_REFLECT') {
          state.log.push(`${target.name} renvoie ${defense!.damage ?? 1} dégât à ${attacker.name} (${defense!.name}).`)
          applyDamage(state, attacker, defense!.damage ?? 1, target)
          continue
        }
        if (defense!.effect === 'REDUCE_2') {
          dealt = Math.max(1, dealt - 2)
          state.log.push(`${target.name} amortit le choc avec ${defense!.name}.`)
        }
      }
    }

    state.log.push(`${target.name} subit ${dealt} dégât(s).`)
    // Un assaillant tué en cours de route (renvoi) ne touche plus de butin.
    applyDamage(state, target, dealt, attacker.isAlive ? attacker : undefined)
  }

  // Brick : pioche 1 carte dès qu'il est attaqué, même si l'attaque est bloquée ou esquivée.
  if (!isFinished(state)) {
    for (const id of attacked) {
      const t = getPlayer(state, id)!
      if (t.shipId === 'brick' && t.isAlive) {
        t.hand.push(...drawFromDeck(state, 1, ctx))
        state.log.push(`${t.name} pioche 1 carte (Brick).`)
      }
    }
  }

  state.discard.push(card)
  state.hasPlayedAttack = true

  if (!isFinished(state) && state.currentEvent?.id === 'kraken' && attacker.isAlive) {
    state.log.push(`Le Kraken punit ${attacker.name} de 2 dégâts.`)
    applyDamage(state, attacker, 2)
  }

  // Jouer une attaque met fin au tour, sauf si la partie est déjà terminée.
  if (!isFinished(state)) endTurn(state, ctx)
}

export function applyDamage(state: GameState, target: PlayerState, amount: number, attacker?: PlayerState) {
  if (!target.isAlive) return
  target.hp -= amount
  if (target.hp > 0) return

  target.hp = 0
  // Revivre : la seconde chance annule l'élimination (donc aucune prime pour l'assaillant).
  if (target.revivePending) {
    target.revivePending = false
    target.hp = 1
    state.log.push(`${target.name} revient à la vie avec 1 PV !`)
    return
  }

  target.isAlive = false
  // Le rôle d'un joueur éliminé est révélé à tous.
  state.log.push(`${target.name} est éliminé — il était ${roleName(target)}.`)
  state.discard.push(...target.permanents)
  target.permanents = []

  if (!attacker) {
    // Mort sans assaillant (Kraken…) : les cartes partent à la défausse.
    state.discard.push(...target.hand)
    target.hand = []
    target.coins = 0
  } else {
    attacker.eliminationsCount += 1
    attacker.hand.push(...target.hand)
    attacker.coins += target.coins
    target.hand = []
    target.coins = 0
    if (attacker.shipId === 'fregate') attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
    if (attacker.shipId === 'brigantin') attacker.hand.push(...drawFromDeck(state, 2))
  }
  // La première mission accomplie, dans l'ordre réel des actions, termine la partie.
  evaluateVictory(state)
}

// ============ POUVOIRS DE NAVIRE ============

export type PowerOpts = { cardId?: string; targetId?: string }

export function useShipPower(state: GameState, playerId: string, opts: PowerOpts = {}, ctx: Ctx = defaultCtx()): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if (state.phase !== 'action' || state.pending) return fail('Tu ne peux pas utiliser ton pouvoir maintenant.')
  const ship = getShip(player.shipId)!
  if (ship.powerType === 'passif' || ship.powerType === 'passif-trigger') return fail('Ce pouvoir est passif.')
  if (ship.powerType === 'actif-tour' && player.powerUsedThisTurn) return fail('Pouvoir déjà utilisé ce tour.')
  if (ship.powerType === 'actif-partie' && player.powerUsedThisGame) return fail('Pouvoir déjà utilisé cette partie.')

  switch (ship.id) {
    case 'sloop': {
      const idx = player.hand.findIndex(c => c.id === opts.cardId)
      if (idx === -1) return fail('Choisis la carte à échanger.')
      const [fresh] = drawFromDeck(state, 1, ctx)
      if (!fresh) return fail('La pioche est vide.')
      const [old] = player.hand.splice(idx, 1)
      state.discard.push(old!)
      player.hand.push(fresh)
      state.log.push(`${player.name} échange une carte avec la pioche (Sloop).`)
      break
    }
    case 'jonque': {
      const [top] = drawFromDeck(state, 1, ctx)
      if (!top) return fail('La pioche est vide.')
      state.deck.unshift(top)
      addNote(state, player.id, `Jonque : la carte du dessus est « ${top.name} ».`)
      state.pending = { kind: 'scry', playerId: player.id }
      state.log.push(`${player.name} scrute la pioche (Jonque).`)
      break
    }
    case 'corvette':
      return fail('L\'esquive de la Corvette se déclenche en réaction à une attaque.')
    case 'cotre': {
      const victim = state.players.find(p => p.id === opts.targetId && p.isAlive && p.id !== player.id)
      if (!victim) return fail('Choisis un adversaire.')
      if (!victim.hand.length) return fail('Sa main est vide.')
      const [stolen] = victim.hand.splice(Math.floor(ctx.rand() * victim.hand.length), 1)
      player.hand.push(stolen!)
      state.log.push(`${player.name} vole 1 carte à ${victim.name} (Cotre).`)
      break
    }
    case 'clipper':
      player.clipperArmed = true
      state.log.push(`${player.name} prépare son bonus Clipper (1 pièce s'il n'attaque pas).`)
      break
    default:
      return fail('Pouvoir inconnu.')
  }

  if (ship.powerType === 'actif-tour') player.powerUsedThisTurn = true
  if (ship.powerType === 'actif-partie') player.powerUsedThisGame = true
  return ok()
}

export function resolveScry(state: GameState, playerId: string, keep: boolean): Res {
  const pending = state.pending
  if (!pending || pending.kind !== 'scry' || pending.playerId !== playerId) return fail('Rien à décider.')
  if (!keep && state.deck.length) state.deck.push(state.deck.shift()!)
  state.pending = undefined
  state.log.push(keep ? 'La carte reste sur le dessus.' : 'La carte est remise sous la pioche.')
  return ok()
}

// ============ BOUTIQUE ============

export function buyShopItem(state: GameState, playerId: string, itemId: string, opts: { targetId?: string } = {}, ctx: Ctx = defaultCtx()): Res {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return fail('Ce n\'est pas ton tour.')
  if (state.phase !== 'action' || state.pending) return fail('La boutique est fermée pour le moment.')
  const idx = state.shop.findIndex(i => i.id === itemId)
  if (idx === -1) return fail('Cet article n\'est plus disponible.')
  const item = state.shop[idx]!
  const discount = state.currentEvent?.id === 'aubaine' ? 1 : 0
  const price = Math.max(1, item.price - discount)
  if (player.coins < price) return fail('Pas assez de pièces.')

  let revealTarget: PlayerState | undefined
  if (item.effect === 'REVEAL_ROLE') {
    revealTarget = state.players.find(p => p.id === opts.targetId && p.isAlive && p.id !== player.id)
    if (!revealTarget) return fail('Choisis un joueur à espionner.')
  }

  player.coins -= price
  switch (item.effect) {
    case 'HEAL_FULL': player.hp = player.maxHp; break
    case 'BUFF_NEXT_ATTACK_2': player.buffNextAttack = (player.buffNextAttack ?? 0) + 2; break
    case 'DRAW_3': player.hand.push(...drawFromDeck(state, 3, ctx)); break
    case 'TRUCE_2': player.truceTurnsLeft = 2; break
    case 'REVIVE_PENDING': player.revivePending = true; break
    case 'REVEAL_ROLE':
      if (revealTarget!.shipId === 'fantome') addNote(state, player.id, `Le Vaisseau Fantôme de ${revealTarget!.name} brouille la longue-vue.`)
      else addNote(state, player.id, `Longue-vue : ${revealTarget!.name} est ${roleName(revealTarget!)}.`)
      break
  }

  state.shop.splice(idx, 1) // l'article disparaît du marché pour tout le monde
  state.log.push(`${player.name} achète ${item.name} (${price}).`)
  return ok()
}

// ============ FIN DE TOUR & ABANDON ============

export function endTurn(state: GameState, ctx: Ctx = defaultCtx(), discardIds: string[] = []) {
  const player = currentPlayer(state)
  if (player) {
    // Défausse à la limite de main : d'abord les choix du joueur, puis automatiquement.
    const max = handMax(player)
    for (const id of discardIds) {
      if (player.hand.length <= max) break
      const i = player.hand.findIndex(c => c.id === id)
      if (i !== -1) state.discard.push(...player.hand.splice(i, 1))
    }
    while (player.hand.length > max) state.discard.push(player.hand.pop()!)

    if (player.clipperArmed) {
      player.clipperArmed = false
      if (player.isAlive && !state.hasPlayedAttack) {
        player.coins += 1
        state.log.push(`${player.name} gagne 1 pièce (Clipper).`)
      }
    }
    if (player.isAlive && player.permanents.some(p => p.effect === 'PERM_COIN_PER_TURN')) player.coins += 1
    if (player.truceTurnsLeft && player.truceTurnsLeft > 0) player.truceTurnsLeft -= 1
  }

  const next = nextAlive(state, state.currentPlayerIndex)
  state.currentPlayerIndex = next
  state.phase = 'event'
  state.hasPlayedAttack = false
  state.pending = undefined
  state.turnDeadline = undefined
  state.log.push(`Tour de ${state.players[next]!.name}.`)
}

/** Un joueur quitte la partie en cours (abandon ou inactivité) : il est retiré du jeu. */
export function forfeit(state: GameState, playerId: string, ctx: Ctx = defaultCtx()) {
  const p = getPlayer(state, playerId)
  if (!p || !p.isAlive || state.phase === 'finished') return
  const wasCurrent = currentPlayer(state)?.id === p.id
  p.isAlive = false
  p.hp = 0
  state.log.push(`${p.name} quitte la partie — il était ${roleName(p)}.`)
  // Traité comme éliminé : ses cartes et pièces vont au joueur suivant (livret de règles).
  const heir = state.players[nextAlive(state, state.players.indexOf(p))]
  if (heir && heir.isAlive && heir.id !== p.id) {
    heir.hand.push(...p.hand)
    heir.coins += p.coins
    if (p.hand.length || p.coins) state.log.push(`${heir.name} récupère ses cartes et ses pièces.`)
  } else {
    state.discard.push(...p.hand)
  }
  p.hand = []
  p.coins = 0
  state.discard.push(...p.permanents)
  p.permanents = []

  // Une attaque en cours ne l'attend plus / n'a plus d'assaillant.
  const pending = state.pending
  if (pending?.kind === 'attack') {
    if (pending.attackerId === p.id) {
      state.discard.push(pending.card)
      state.pending = undefined
      state.phase = 'action'
    } else if (pending.targetIds.includes(p.id)) {
      pending.responses[p.id] = {}
      if (allResponded(pending)) resolveAttack(state, ctx)
    }
  } else if (pending?.kind === 'scry' && pending.playerId === p.id) {
    state.pending = undefined
  }

  if (wasCurrent && !isFinished(state) && state.phase !== 'event') endTurn(state, ctx)
}
