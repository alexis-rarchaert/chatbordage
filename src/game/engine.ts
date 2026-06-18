/**
 * Moteur de jeu ChatBordage — fonctions pures qui transforment un GameState.
 * Aucune dépendance UI. La GameView (et plus tard un backend) peuvent appeler ces fonctions.
 */
import type { Card, GameState, PlayerState, Ship } from './types'
import { SHIPS, getShip } from './ships'
import { ROLES, assignRoles, checkVictory } from './roles'
import { freshDeck } from './cards'
import { drawSeaEvent } from './events'
import { freshShop } from './shop'

type SetupOptions = {
  playerNames: string[]
  shipIds?: string[]              // si fourni, attribue les navires dans l'ordre
  randomShips?: boolean            // sinon tire au hasard
  rand?: () => number
}

export function setupGame({ playerNames, shipIds, randomShips = true, rand = Math.random }: SetupOptions): GameState {
  if (playerNames.length < 4 || playerNames.length > 6) {
    throw new Error('ChatBordage : 4 à 6 joueurs requis.')
  }

  const roleIds = assignRoles(playerNames.length, rand)
  const chosenShips: Ship[] = shipIds && shipIds.length === playerNames.length
    ? shipIds.map(id => {
        const s = getShip(id)
        if (!s) throw new Error(`Navire inconnu : ${id}`)
        return s
      })
    : pickShips(playerNames.length, rand, randomShips)

  const deck = freshDeck(rand)

  const players: PlayerState[] = playerNames.map((name, i) => {
    const ship = chosenShips[i]
    const roleId = roleIds[i]
    const role = ROLES.find(r => r.id === roleId)!
    const maxHp = ship.hp + role.startingHpBonus
    const hand = deck.splice(0, 3)
    return {
      id: `p${i + 1}`,
      name,
      shipId: ship.id,
      roleId,
      hp: maxHp,
      maxHp,
      hand,
      permanents: [],
      coins: 0,
      isAlive: true,
      eliminationsCount: 0
    }
  })

  // Capitaine commence
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
    log: [`Partie lancée — ${players.length} joueurs.`]
  }
}

function pickShips(count: number, rand: () => number, randomize: boolean): Ship[] {
  const pool = randomize ? [...SHIPS].sort(() => rand() - 0.5) : [...SHIPS]
  return pool.slice(0, count)
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `g_${Math.random().toString(36).slice(2)}`
}

// ============ ACTIONS ============

export function startTurn(state: GameState, rand: () => number = Math.random) {
  const event = drawSeaEvent(rand)
  state.currentEvent = event
  state.events.push(event)
  state.phase = 'draw'
  state.hasPlayedAttack = false
  state.log.push(`Événement : ${event.name} — ${event.description}`)

  // Effets immédiats
  if (event.id === 'tempete') {
    state.players.forEach(p => { if (p.isAlive && p.hp > 1) p.hp -= 1 })
  }
  if (event.id === 'tresor') {
    state.players.forEach(p => { if (p.isAlive) p.coins += 1 })
  }
  if (event.id === 'reflux') {
    state.players.forEach(p => { if (p.isAlive) p.hp = Math.min(p.maxHp, p.hp + 1) })
  }

  // Reset pouvoirs par tour
  state.players.forEach(p => { p.powerUsedThisTurn = false })
}

export function drawCards(state: GameState, playerId: string): boolean {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId || state.phase !== 'draw') return false

  const handMax = getShip(player.shipId)?.id === 'galion' ? 6 : 5
  let toDraw = 2

  // Caravelle : +1 pioche gratuite
  if (player.shipId === 'caravelle') toDraw += 1
  // Vents favorables (event) : +1
  if (state.currentEvent?.id === 'vents') toDraw += 1

  const space = handMax - player.hand.length
  const actuallyDraw = Math.min(toDraw, space)
  if (actuallyDraw > 0) {
    const drawn = state.deck.splice(0, actuallyDraw)
    player.hand.push(...drawn)
  }

  state.phase = 'action'
  state.log.push(`${player.name} pioche ${actuallyDraw} carte(s).`)
  return true
}

export function gainCoins(state: GameState, playerId: string): boolean {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId || state.phase !== 'draw') return false
  let gain = 2
  // Gabare : +1
  if (player.shipId === 'gabare') gain += 1
  player.coins += gain
  state.phase = 'action'
  state.log.push(`${player.name} prend ${gain} pièce(s).`)
  return true
}

type PlayOpts = { targetId?: string; defenseCardId?: string }

export function playCard(state: GameState, playerId: string, cardId: string, opts: PlayOpts = {}): boolean {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId || state.phase !== 'action') return false
  if (player.hp <= 0) return false

  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return false
  const card = player.hand[idx]
  player.hand.splice(idx, 1)

  // Permanent : pose en jeu
  if (card.permanent) {
    if (player.permanents.some(c => c.name === card.name)) {
      // Pas de doublon : remettre la carte en main, refuser
      player.hand.push(card)
      return false
    }
    player.permanents.push(card)
    if (card.effect === 'PERM_MAXHP_1') {
      player.maxHp += 1
      player.hp += 1
    }
    state.log.push(`${player.name} équipe : ${card.name}.`)
    return true
  }

  if (card.family === 'ABORDAGE') {
    return resolveAttack(state, player, card, opts)
  }

  if (card.family === 'MAREE') {
    if (card.heal) {
      player.hp = Math.min(player.maxHp, player.hp + card.heal)
      state.log.push(`${player.name} se soigne de ${card.heal}.`)
    }
    if (card.effect === 'DRAW_2') {
      const drawn = state.deck.splice(0, 2)
      player.hand.push(...drawn)
      state.log.push(`${player.name} pioche 2 cartes.`)
    }
    state.discard.push(card)
    return true
  }

  if (card.family === 'RUMEUR') {
    const target = opts.targetId ? state.players.find(p => p.id === opts.targetId && p.isAlive) : null
    switch (card.effect) {
      case 'STEAL_CARD':
        if (target && target.hand.length) {
          const stolen = target.hand.splice(Math.floor(Math.random() * target.hand.length), 1)[0]
          player.hand.push(stolen)
          state.log.push(`${player.name} vole 1 carte à ${target.name}.`)
        }
        break
      case 'PEEK_HAND':
        if (target) state.log.push(`${player.name} épie la main de ${target.name}.`)
        break
      case 'PEEK_ROLE':
        if (target) {
          if (target.shipId === 'fantome') state.log.push(`Le Vaisseau Fantôme protège ${target.name} de la révélation.`)
          else state.log.push(`${player.name} découvre le rôle de ${target.name}.`)
        }
        break
      case 'SWAP_HAND':
        if (target) {
          const tmp = player.hand
          player.hand = target.hand
          target.hand = tmp
          state.log.push(`${player.name} échange sa main avec ${target.name}.`)
        }
        break
      case 'DISCARD_RANDOM':
        if (target && target.hand.length) {
          const drop = target.hand.splice(Math.floor(Math.random() * target.hand.length), 1)[0]
          state.discard.push(drop)
          state.log.push(`${target.name} défausse 1 carte (Pavillon noir).`)
        }
        break
      case 'DESTROY_TREASURE':
        if (target) {
          if (target.shipId === 'trois-mats') {
            state.log.push(`Le Trois-Mâts protège les équipements de ${target.name}.`)
          } else if (target.permanents.length) {
            const drop = target.permanents.shift()!
            state.discard.push(drop)
            state.log.push(`${player.name} détruit ${drop.name} de ${target.name}.`)
          }
        }
        break
    }
    state.discard.push(card)
    return true
  }

  // VOILE jouée hors réaction : c'est invalide, on remet en main
  if (card.family === 'VOILE') {
    player.hand.push(card)
    return false
  }

  state.discard.push(card)
  return true
}

function resolveAttack(state: GameState, attacker: PlayerState, card: Card, opts: PlayOpts): boolean {
  const ship = getShip(attacker.shipId)!
  let dmg = (card.damage ?? 1) + (ship.damage - 1)

  // Étendard équipé +1
  if (attacker.permanents.some(p => p.effect === 'PERM_DMG_1')) dmg += 1
  // Felouque trigger
  // Buff Poudre noire
  if (attacker.buffNextAttack) {
    dmg += attacker.buffNextAttack
    attacker.buffNextAttack = 0
  }
  // Brume
  if (state.currentEvent?.id === 'brume') dmg = Math.max(1, dmg - 1)

  // Cibles
  let targets: PlayerState[] = []
  if (card.effect === 'AOE') {
    targets = state.players.filter(p => p.isAlive && p.id !== attacker.id)
  } else if (card.effect === 'MULTI_2') {
    // ici on attend 2 cibles : pour rester simple, on accepte un seul targetId puis on tire un 2e aléatoire
    if (opts.targetId) {
      const t1 = state.players.find(p => p.id === opts.targetId && p.isAlive)
      if (t1) targets.push(t1)
    }
    const others = state.players.filter(p => p.isAlive && p.id !== attacker.id && !targets.includes(p))
    if (others.length) targets.push(others[Math.floor(Math.random() * others.length)])
  } else {
    const t = opts.targetId ? state.players.find(p => p.id === opts.targetId && p.isAlive) : null
    if (t) targets.push(t)
  }

  if (!targets.length) {
    attacker.hand.push(card) // attaque ratée — on remet la carte
    return false
  }

  // Trêve : la cible est intouchable pendant 2 tours
  targets = targets.filter(t => !(t.truceTurnsLeft && t.truceTurnsLeft > 0))

  for (const target of targets) {
    let actualDmg = dmg
    // Felouque : +1 si la cible a plus de PV
    if (attacker.shipId === 'felouque' && target.hp > attacker.hp) actualDmg += 1
    // Pavois doré (1er coup réduit)
    if (target.permanents.some(p => p.effect === 'PERM_ARMOR_FIRST')) {
      actualDmg = Math.max(1, actualDmg - 1)
    }
    // Cuirassé : -1 dégât minimum 1
    if (target.shipId === 'cuirasse') actualDmg = Math.max(1, actualDmg - 1)

    // Réaction Voile (si non PIERCE et si fournie)
    if (card.effect !== 'PIERCE' && opts.defenseCardId) {
      const dIdx = target.hand.findIndex(c => c.id === opts.defenseCardId && c.family === 'VOILE')
      if (dIdx !== -1) {
        const defense = target.hand.splice(dIdx, 1)[0]
        state.discard.push(defense)
        if (defense.effect === 'BLOCK') {
          state.log.push(`${target.name} esquive avec ${defense.name}.`)
          continue
        }
        if (defense.effect === 'REDUCE_2') {
          actualDmg = Math.max(1, actualDmg - 2)
        }
        if (defense.effect === 'BLOCK_REFLECT') {
          applyDamage(state, attacker, defense.damage ?? 1)
          state.log.push(`${target.name} renvoie ${defense.damage ?? 1} dégât à ${attacker.name}.`)
          continue
        }
      }
    }

    // Corvette esquive (actif 1x partie)
    if (target.shipId === 'corvette' && !target.powerUsedThisGame) {
      // ici on laisse l'UI décider d'activer — pour le moteur, on n'active pas auto
    }

    applyDamage(state, target, actualDmg, attacker)
    // Brick : pioche 1 carte quand attaqué
    if (target.shipId === 'brick' && target.isAlive) {
      const drawn = state.deck.splice(0, 1)
      target.hand.push(...drawn)
    }
  }

  state.discard.push(card)
  state.hasPlayedAttack = true
  state.log.push(`${attacker.name} attaque avec ${card.name} (${dmg}).`)

  // L'attaque met fin au tour, sauf si l'événement Kraken inflige avant la fin
  if (state.currentEvent?.id === 'kraken') {
    applyDamage(state, attacker, 2)
    state.log.push(`Le Kraken punit ${attacker.name} de 2 dégâts.`)
  }
  endTurn(state)
  return true
}

export function applyDamage(state: GameState, target: PlayerState, amount: number, attacker?: PlayerState) {
  if (!target.isAlive) return
  target.hp -= amount
  if (target.hp <= 0) {
    target.hp = 0
    target.isAlive = false
    state.log.push(`${target.name} est éliminé.`)
    if (attacker) {
      attacker.eliminationsCount += 1
      attacker.hand.push(...target.hand)
      attacker.coins += target.coins
      target.hand = []
      target.coins = 0
      // Frégate : +1 PV à l'élimination
      if (attacker.shipId === 'fregate') attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
      // Brigantin : +2 cartes piochées
      if (attacker.shipId === 'brigantin') {
        const drawn = state.deck.splice(0, 2)
        attacker.hand.push(...drawn)
      }
    }
    // Revivre éventuel
    if (target.revivePending) {
      target.revivePending = false
      target.isAlive = true
      target.hp = 1
      state.log.push(`${target.name} revient à la vie avec 1 PV !`)
    }
  }

  const victory = checkVictory(state)
  if (victory) {
    state.phase = 'finished'
    state.winnerIds = victory.winners.map(w => w.id)
    state.log.push(`Victoire — ${victory.reason}`)
  }
}

export function useShipPower(state: GameState, playerId: string): boolean {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId) return false
  const ship = getShip(player.shipId)!
  if (ship.powerType === 'passif' || ship.powerType === 'passif-trigger') return false
  if (ship.powerType === 'actif-tour' && player.powerUsedThisTurn) return false
  if (ship.powerType === 'actif-partie' && player.powerUsedThisGame) return false

  if (ship.id === 'sloop' && player.hand.length) {
    const removed = player.hand.splice(Math.floor(Math.random() * player.hand.length), 1)[0]
    state.discard.push(removed)
    const drawn = state.deck.splice(0, 1)
    player.hand.push(...drawn)
  }
  if (ship.id === 'jonque' && state.deck.length) {
    // l'UI doit afficher la carte du dessus puis décider
  }
  if (ship.id === 'corvette') {
    // marquera l'esquive pour la prochaine attaque
    player.powerUsedThisGame = true
  }
  if (ship.id === 'cotre' && state.players.length > 1) {
    const others = state.players.filter(p => p.id !== player.id && p.isAlive && p.hand.length)
    if (others.length) {
      const victim = others[Math.floor(Math.random() * others.length)]
      const stolen = victim.hand.splice(Math.floor(Math.random() * victim.hand.length), 1)[0]
      player.hand.push(stolen)
      state.log.push(`${player.name} vole 1 carte à ${victim.name} (Cotre).`)
    }
    player.powerUsedThisGame = true
  }
  if (ship.id === 'clipper' && !state.hasPlayedAttack) {
    player.coins += 1
    player.powerUsedThisTurn = true
    state.log.push(`${player.name} gagne 1 pièce (Clipper).`)
  }

  if (ship.powerType === 'actif-tour') player.powerUsedThisTurn = true
  return true
}

export function buyShopItem(state: GameState, playerId: string, itemId: string): boolean {
  const player = currentPlayer(state)
  if (!player || player.id !== playerId || state.phase !== 'action') return false
  const idx = state.shop.findIndex(i => i.id === itemId)
  if (idx === -1) return false
  const item = state.shop[idx]
  const discount = state.currentEvent?.id === 'aubaine' ? 1 : 0
  const price = Math.max(1, item.price - discount)
  if (player.coins < price) return false
  player.coins -= price

  switch (item.effect) {
    case 'HEAL_FULL': player.hp = player.maxHp; break
    case 'BUFF_NEXT_ATTACK_2': player.buffNextAttack = (player.buffNextAttack ?? 0) + 2; break
    case 'DRAW_3': {
      const drawn = state.deck.splice(0, 3); player.hand.push(...drawn); break
    }
    case 'TRUCE_2': player.truceTurnsLeft = 2; break
    case 'REVIVE_PENDING': player.revivePending = true; break
    case 'REVEAL_ROLE': /* l'UI gère le ciblage et l'affichage */ break
  }

  state.shop.splice(idx, 1) // l'item disparaît du marché pour tout le monde
  state.log.push(`${player.name} achète ${item.name} (${price}).`)
  return true
}

export function endTurn(state: GameState) {
  const player = currentPlayer(state)
  if (player) {
    // Défausse forcée si main > limite
    const handMax = getShip(player.shipId)?.id === 'galion' ? 6 : 5
    while (player.hand.length > handMax) {
      const drop = player.hand.pop()!
      state.discard.push(drop)
    }
    // Cale (pièce passive)
    if (player.permanents.some(p => p.effect === 'PERM_COIN_PER_TURN')) player.coins += 1
    // Décrément trêve
    if (player.truceTurnsLeft && player.truceTurnsLeft > 0) player.truceTurnsLeft -= 1
  }

  // Joueur suivant vivant (sens horaire)
  let next = (state.currentPlayerIndex + 1) % state.players.length
  let guard = state.players.length
  while (!state.players[next].isAlive && guard-- > 0) {
    next = (next + 1) % state.players.length
  }
  state.currentPlayerIndex = next
  state.phase = 'event'
  state.hasPlayedAttack = false
  state.log.push(`Tour de ${state.players[next].name}.`)
}

export function currentPlayer(state: GameState): PlayerState | undefined {
  return state.players[state.currentPlayerIndex]
}
