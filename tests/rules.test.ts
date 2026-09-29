import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAction, advance, buildGameView, setupGame, currentPlayer, checkVictory, evaluateVictory, forfeit,
  CARDS, SEA_EVENTS, newRoom, joinRoom, sitDown, leaveRoom, postChat, startRematch, updateSeat, startRoom, viewForUser,
  type GameState, type RoleId, type Card
} from '../supabase/functions/_shared/game/index.ts'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const card = (name: string): Card => ({ ...CARDS.find(c => c.name === name)!, id: `t-${name}-${Math.random()}` })

/** Partie à 5 joueurs p1..p5, événement « mer calme », c'est à p1 de jouer (phase de ressources). */
function game(roles: RoleId[], ships: string[] = ['fregate', 'galion', 'sloop', 'brick', 'clipper']) {
  const rand = seeded(7)
  const s = setupGame({ playerNames: ['A', 'B', 'C', 'D', 'E'], playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'], shipIds: ships, rand })
  s.players.forEach((p, i) => { p.roleId = roles[i]!; p.hand = []; p.coins = 0 })
  s.currentPlayerIndex = 0
  s.phase = 'event'
  advance(s, { rand, now: 0 })
  s.currentEvent = SEA_EVENTS.find(e => e.id === 'calme')!
  return { s, rand, ctx: { rand, now: 0 } }
}
const R5: RoleId[] = ['capitaine', 'protecteur', 'chasseur', 'renegat', 'contrebandier']
const P = (s: GameState, id: string) => s.players.find(p => p.id === id)!
const kill = (s: GameState, id: string) => { P(s, id).isAlive = false; P(s, id).hp = 0 }

// ---------- victoire ----------
test('duel final : le Capitaine gagne quand il reste 2 joueurs, avec le Protecteur s\'il est en vie', () => {
  const { s } = game(R5)
  kill(s, 'p3'); kill(s, 'p4')
  assert.equal(checkVictory(s), null, '3 en vie : la partie continue')
  kill(s, 'p5')
  const v = checkVictory(s)!
  assert.deepEqual(v.winners.map(w => w.id).sort(), ['p1', 'p2'])
})

test('duel final : Capitaine contre Renégat → le Capitaine gagne seul', () => {
  const { s } = game(R5)
  kill(s, 'p2'); kill(s, 'p3'); kill(s, 'p5')
  assert.deepEqual(checkVictory(s)!.winners.map(w => w.id), ['p1'])
})

test('Capitaine éliminé : on joue jusqu\'au dernier survivant (Renégat)', () => {
  const { s } = game(R5)
  kill(s, 'p1'); kill(s, 'p5')
  assert.equal(checkVictory(s), null, '3 en vie sans Capitaine : on continue')
  kill(s, 'p3')
  assert.equal(checkVictory(s), null, '2 en vie sans Capitaine : on continue')
  kill(s, 'p2')
  assert.deepEqual(checkVictory(s)!.winners.map(w => w.id), ['p4'])
})

test('Contrebandier : 15 pièces à tout moment ; Chasseur : 2 éliminations', () => {
  const a = game(R5).s
  P(a, 'p5').coins = 15
  assert.deepEqual(checkVictory(a)!.winners.map(w => w.id), ['p5'])
  const b = game(R5).s
  P(b, 'p3').eliminationsCount = 2
  assert.deepEqual(checkVictory(b)!.winners.map(w => w.id), ['p3'])
})

test('la victoire est déclarée dès l\'élimination qui l\'accomplit, dans l\'ordre réel des actions', () => {
  const { s, ctx } = game(R5)
  s.currentPlayerIndex = 2 // p3 = Chasseur
  s.phase = 'action'
  P(s, 'p3').eliminationsCount = 1
  P(s, 'p3').hand = [card('Tir de canon')]
  P(s, 'p4').hp = 1
  P(s, 'p4').hand = []
  assert.ok(applyAction(s, 'p3', { type: 'play', cardId: P(s, 'p3').hand[0]!.id, targetId: 'p4' }, ctx).ok)
  assert.equal(s.phase, 'finished')
  assert.deepEqual(s.winnerIds, ['p3'])
})

// ---------- rôles des éliminés ----------
test('le rôle d\'un joueur éliminé est révélé à tous, dans la vue et dans le journal', () => {
  const { s, ctx } = game(R5)
  s.currentPlayerIndex = 2
  s.phase = 'action'
  P(s, 'p3').hand = [card('Tir de canon')]
  P(s, 'p4').hp = 1
  P(s, 'p4').hand = []
  applyAction(s, 'p3', { type: 'play', cardId: P(s, 'p3').hand[0]!.id, targetId: 'p4' }, ctx)
  const v = buildGameView(s, 'p5')
  assert.equal(v.players.find(p => p.id === 'p4')!.roleId, 'renegat')
  assert.ok(v.log.some(l => l.includes('D est éliminé') && l.includes('Renégat')))
  assert.equal(v.players.find(p => p.id === 'p2')!.roleId, null, 'les vivants restent cachés')
})

// ---------- navires (document de conception) ----------
test('Caravelle : 1 carte gratuite chaque tour, même si on prend des pièces', () => {
  const { s, ctx } = game(R5, ['caravelle', 'galion', 'sloop', 'brick', 'clipper'])
  const before = P(s, 'p1').hand.length
  assert.ok(applyAction(s, 'p1', { type: 'coins' }, ctx).ok)
  assert.equal(P(s, 'p1').coins, 2)
  assert.equal(P(s, 'p1').hand.length, before + 1)

  const g2 = game(R5, ['caravelle', 'galion', 'sloop', 'brick', 'clipper'])
  applyAction(g2.s, 'p1', { type: 'draw' }, g2.ctx)
  assert.equal(P(g2.s, 'p1').hand.length, 3, '2 cartes + 1 gratuite')
})

test('Caravelle : la carte gratuite respecte la limite de main', () => {
  const { s, ctx } = game(R5, ['caravelle', 'galion', 'sloop', 'brick', 'clipper'])
  P(s, 'p1').hand = [card('Rhum'), card('Rhum'), card('Rhum'), card('Rhum'), card('Rhum')]
  applyAction(s, 'p1', { type: 'coins' }, ctx)
  assert.equal(P(s, 'p1').hand.length, 5)
})

test('Brick : pioche 1 carte quand il est attaqué, même si l\'attaque est bloquée', () => {
  const { s, ctx } = game(R5, ['fregate', 'galion', 'sloop', 'brick', 'clipper'])
  applyAction(s, 'p1', { type: 'coins' }, ctx)
  P(s, 'p1').hand = [card('Coup de sabre')]
  const block = card('Voile rapide')
  P(s, 'p4').hand = [block]
  applyAction(s, 'p1', { type: 'play', cardId: P(s, 'p1').hand[0]!.id, targetId: 'p4' }, ctx)
  applyAction(s, 'p4', { type: 'react', defenseCardId: block.id }, ctx)
  assert.equal(P(s, 'p4').hand.length, 1, 'a défaussé la Voile puis pioché 1 carte')
})

test('Clipper : +1 pièce en fin de tour s\'il n\'a pas attaqué, rien s\'il attaque', () => {
  const a = game(R5, ['clipper', 'galion', 'sloop', 'brick', 'fregate'])
  applyAction(a.s, 'p1', { type: 'coins' }, a.ctx)
  assert.ok(applyAction(a.s, 'p1', { type: 'power' }, a.ctx).ok)
  assert.equal(P(a.s, 'p1').coins, 2, 'pas de bonus immédiat')
  applyAction(a.s, 'p1', { type: 'end' }, a.ctx)
  assert.equal(P(a.s, 'p1').coins, 3, 'bonus à la fin du tour')

  const b = game(R5, ['clipper', 'galion', 'sloop', 'brick', 'fregate'])
  applyAction(b.s, 'p1', { type: 'coins' }, b.ctx)
  applyAction(b.s, 'p1', { type: 'power' }, b.ctx)
  P(b.s, 'p1').hand = [card('Coup de sabre')]
  P(b.s, 'p2').hand = []
  applyAction(b.s, 'p1', { type: 'play', cardId: P(b.s, 'p1').hand[0]!.id, targetId: 'p2' }, b.ctx)
  assert.equal(P(b.s, 'p1').coins, 2, 'il a attaqué : pas de bonus')
})

// ---------- livret de règles ----------
test('défausse volontaire à tout moment du tour', () => {
  const { s, ctx } = game(R5)
  const c = card('Rhum')
  P(s, 'p1').hand = [c]
  assert.ok(applyAction(s, 'p1', { type: 'discard', cardId: c.id }, ctx).ok, 'en phase de ressources')
  assert.equal(P(s, 'p1').hand.length, 0)
  assert.equal(applyAction(s, 'p2', { type: 'discard', cardId: 'x' }, ctx).ok, false, 'pas hors de son tour')
})

test('un joueur qui quitte : ses cartes et pièces vont au joueur suivant, ses équipements à la défausse', () => {
  const { s, ctx } = game(R5)
  P(s, 'p2').hand = [card('Rhum'), card('Rhum')]
  P(s, 'p2').coins = 5
  P(s, 'p2').permanents = [card('Cale')]
  const discard = s.discard.length
  forfeit(s, 'p2', ctx)
  assert.equal(P(s, 'p3').hand.length, 2)
  assert.equal(P(s, 'p3').coins, 5)
  assert.equal(P(s, 'p2').isAlive, false)
  assert.equal(s.discard.length, discard + 1)
})

test('une Rumeur peut viser soi-même (Sabotage sur son propre équipement)', () => {
  const { s, ctx } = game(R5)
  applyAction(s, 'p1', { type: 'coins' }, ctx)
  P(s, 'p1').permanents = [card('Cale')]
  const sab = card('Sabotage')
  P(s, 'p1').hand = [sab]
  assert.ok(applyAction(s, 'p1', { type: 'play', cardId: sab.id, targetId: 'p1' }, ctx).ok)
  assert.equal(P(s, 'p1').permanents.length, 0)
})

test('Pillage : vole un équipement ; Coffre au trésor : +4 pièces', () => {
  const { s, ctx } = game(R5)
  applyAction(s, 'p1', { type: 'coins' }, ctx)
  P(s, 'p2').permanents = [card('Étendard')]
  const pil = card('Pillage')
  const coffre = card('Coffre au trésor')
  P(s, 'p1').hand = [pil, coffre]
  assert.ok(applyAction(s, 'p1', { type: 'play', cardId: pil.id, targetId: 'p2' }, ctx).ok)
  assert.equal(P(s, 'p1').permanents[0]!.name, 'Étendard')
  assert.equal(P(s, 'p2').permanents.length, 0)
  const before = P(s, 'p1').coins
  assert.ok(applyAction(s, 'p1', { type: 'play', cardId: coffre.id }, ctx).ok)
  assert.equal(P(s, 'p1').coins, before + 4)
})

test('à l\'élimination, les équipements du joueur partent à la défausse', () => {
  const { s, ctx } = game(R5)
  s.currentPlayerIndex = 2
  s.phase = 'action'
  P(s, 'p3').hand = [card('Tir de canon')]
  P(s, 'p4').hp = 1
  P(s, 'p4').hand = []
  P(s, 'p4').permanents = [card('Cale')]
  applyAction(s, 'p3', { type: 'play', cardId: P(s, 'p3').hand[0]!.id, targetId: 'p4' }, ctx)
  assert.equal(P(s, 'p4').permanents.length, 0)
})

// ---------- salons : spectateurs, chat, revanche ----------
function startedRoom() {
  const room = newRoom('ROOM', 'u1', 'Alice')
  for (const [id, n] of [['u2', 'Bob'], ['u3', 'Cleo'], ['u4', 'Dan']]) joinRoom(room, id!, n!)
  for (const u of ['u2', 'u3', 'u4']) updateSeat(room, u, { ready: true })
  assert.ok(startRoom(room, 'u1', { rand: seeded(3), now: 0 }).ok)
  return room
}

test('spectateur : rejoint en cours de partie, ne voit ni main ni rôle caché, ne peut pas jouer', () => {
  const room = startedRoom()
  assert.ok(joinRoom(room, 'u9', 'Zed').ok)
  const v = viewForUser(room, 'u9') as any
  assert.equal(v.isSpectator, true)
  assert.deepEqual(v.you.hand, [])
  assert.equal(v.you.roleId, null)
  const hidden = v.players.filter((p: any) => p.roleId !== null)
  assert.equal(hidden.length, 1, 'seul le Capitaine est public')
  assert.equal(room.state!.players.some(p => p.id === 'u9'), false)
  const res = applyAction(room.state!, 'u9', { type: 'draw' })
  assert.equal(res.ok, false)
  assert.ok((viewForUser(room, 'u1') as any).spectators.includes('Zed'))
})

test('spectateur : peut prendre une place seulement au salon d\'attente', () => {
  const room = newRoom('ROOM', 'u1', 'Alice')
  assert.ok(joinRoom(room, 'u2', 'Bob').ok)
  room.status = 'playing'
  assert.ok(joinRoom(room, 'u3', 'Cleo').ok)
  assert.equal(sitDown(room, 'u3').ok, false)
  room.status = 'lobby'
  assert.ok(sitDown(room, 'u3').ok)
  assert.equal(room.seats.length, 3)
})

test('chat : texte nettoyé, limité, anti-flood ; spectateurs inclus', () => {
  const room = startedRoom()
  joinRoom(room, 'u9', 'Zed')
  assert.ok(postChat(room, 'u1', '  Salut\n  tout   le monde  ', { rand: Math.random, now: 1000 }).ok)
  assert.equal(room.chat.at(-1)!.text, 'Salut tout le monde')
  assert.equal(postChat(room, 'u1', 'encore', { rand: Math.random, now: 1500 }).ok, false, 'trop rapide')
  assert.ok(postChat(room, 'u1', 'encore', { rand: Math.random, now: 2500 }).ok)
  assert.ok(postChat(room, 'u9', 'je regarde', { rand: Math.random, now: 1000 }).ok, 'spectateur')
  assert.equal(postChat(room, 'u1', '   ', { rand: Math.random, now: 9000 }).ok, false, 'vide')
  postChat(room, 'u2', 'x'.repeat(500), { rand: Math.random, now: 9000 })
  assert.equal(room.chat.at(-1)!.text.length, 200)
  assert.equal(postChat(room, 'inconnu', 'hey', { rand: Math.random, now: 9000 }).ok, false)
  assert.ok(((viewForUser(room, 'u9') as any).roomChat as any[]).length >= 3)
})

test('revanche : seulement après la fin, mêmes joueurs et navires, tout le monde redevient « pas prêt »', () => {
  const room = startedRoom()
  assert.equal(startRematch(room, 'u1').ok, false, 'partie en cours')
  const ship = room.state!.players[1]!.shipId
  room.state!.phase = 'finished'
  room.status = 'finished'
  joinRoom(room, 'u9', 'Zed')
  assert.equal(startRematch(room, 'u9').ok, false, 'un spectateur ne lance pas la revanche')
  assert.ok(startRematch(room, 'u2').ok)
  assert.equal(room.status, 'lobby')
  assert.equal(room.state, null)
  assert.equal(room.seats.length, 4)
  assert.ok(room.seats.every(s => !s.ready))
  assert.equal((viewForUser(room, 'u3') as any).status, 'lobby')
  assert.equal((viewForUser(room, 'u9') as any).isSpectator, true)
  // les joueurs peuvent relancer
  updateSeat(room, 'u2', { shipId: ship })
  for (const u of ['u2', 'u3', 'u4']) updateSeat(room, u, { ready: true })
  assert.ok(startRoom(room, 'u1', { rand: seeded(5), now: 0 }).ok)
})

test('quitter : spectateur retiré ; joueur en partie abandonne ; salon terminé libère la place', () => {
  const room = startedRoom()
  joinRoom(room, 'u9', 'Zed')
  assert.ok(leaveRoom(room, 'u9').ok)
  assert.equal(room.spectators.length, 0)
  assert.ok(leaveRoom(room, 'u2').ok)
  assert.equal(room.state!.players.find(p => p.id === 'u2')!.isAlive, false)
  room.status = 'finished'
  room.state!.phase = 'finished'
  assert.ok(leaveRoom(room, 'u3').ok)
  assert.equal(room.seats.some(s => s.userId === 'u3'), false)
})
