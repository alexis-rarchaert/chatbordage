import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAction, buildGameView, setupGame, advance, processTimers, CARDS, SHIPS, currentPlayer,
  newRoom, joinRoom, updateSeat, startRoom, viewForUser, leaveLobby, forfeit,
  type Action, type GameState, type Ctx
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

const names = (n: number) => Array.from({ length: n }, (_, i) => `J${i + 1}`)

function totalCards(s: GameState) {
  const inFlight = s.pending?.kind === 'attack' ? 1 : 0
  return inFlight + s.deck.length + s.discard.length + s.players.reduce((n, p) => n + p.hand.length + p.permanents.length, 0)
}

/** Un bot qui joue au hasard des actions légales. */
function botAction(s: GameState, rand: () => number): { pid: string; action: Action } {
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]!
  if (s.pending?.kind === 'attack') {
    const p = pick(s.pending.targetIds.filter(id => !s.pending!.responses[id]).map(id => s.players.find(x => x.id === id)!))
    const blockers = p.hand.filter(c => c.family === 'VOILE')
    if (blockers.length && rand() < 0.6) return { pid: p.id, action: { type: 'react', defenseCardId: pick(blockers).id } }
    if (p.shipId === 'corvette' && rand() < 0.5) return { pid: p.id, action: { type: 'react', dodge: true } }
    return { pid: p.id, action: { type: 'react' } }
  }
  const me = currentPlayer(s)!
  if (s.pending?.kind === 'scry') return { pid: me.id, action: { type: 'scry', keep: rand() < 0.5 } }
  if (s.phase === 'draw') return { pid: me.id, action: rand() < 0.6 ? { type: 'draw' } : { type: 'coins' } }
  const others = s.players.filter(p => p.isAlive && p.id !== me.id)
  const r = rand()
  if (r < 0.55 && me.hand.length) {
    const c = pick(me.hand)
    return { pid: me.id, action: { type: 'play', cardId: c.id, targetId: pick(others).id, targetIds: [pick(others).id, pick(others).id] } }
  }
  if (r < 0.7) return { pid: me.id, action: { type: 'buy', itemId: pick(s.shop.length ? s.shop : [{ id: 'x' } as any]).id, targetId: pick(others).id } }
  if (r < 0.8) return { pid: me.id, action: { type: 'power', cardId: me.hand[0]?.id, targetId: pick(others).id } }
  return { pid: me.id, action: { type: 'end', discardIds: me.hand.map(c => c.id) } }
}

test('le deck fait 100 cartes environ et 15 navires existent', () => {
  assert.ok(CARDS.length >= 90)
  assert.equal(SHIPS.length, 15)
})

for (const count of [4, 5, 6, 7, 8]) {
  test(`parties aléatoires à ${count} joueurs : cartes conservées, jamais bloquées`, () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rand = seeded(seed * 7 + count)
      let now = 1_000_000
      const ctx = (): Ctx => ({ rand, now })
      const s = setupGame({ playerNames: names(count), rand, turnSeconds: 60 })
      const total = totalCards(s)
      advance(s, ctx())
      let steps = 0
      while (s.phase !== 'finished' && steps++ < 4000) {
        now += 5000
        const { pid, action } = botAction(s, rand)
        applyAction(s, pid, action, ctx())
        assert.equal(totalCards(s), total, `cartes perdues (seed ${seed}, étape ${steps})`)
        for (const p of s.players) {
          assert.ok(p.hp >= 0 && p.hp <= p.maxHp + 5, 'PV incohérents')
          assert.ok(p.isAlive || (p.hand.length === 0 && p.coins === 0), 'un mort garde des cartes/pièces')
        }
        if (s.phase !== 'finished') assert.ok(currentPlayer(s)!.isAlive, 'le joueur actif est mort')
      }
      if (s.phase !== 'finished') {
        // Pas de victoire par les bots : les minuteurs doivent débloquer la partie.
        for (let i = 0; i < 400 && s.phase !== 'finished'; i++) { now += 120_000; processTimers(s, ctx()) }
      }
      assert.equal(s.phase, 'finished', `partie non terminée (seed ${seed})`)
    }
  })
}

test('les vues ne révèlent ni rôles cachés ni mains adverses', () => {
  const s = setupGame({ playerNames: names(5), rand: seeded(3) })
  advance(s, { rand: seeded(3), now: 1 })
  const viewer = s.players.find(p => p.roleId !== 'capitaine')!
  const v = buildGameView(s, viewer.id)
  const json = JSON.stringify(v)
  for (const p of s.players) {
    const pv = v.players.find(x => x.id === p.id)!
    if (p.id === viewer.id || p.roleId === 'capitaine') assert.equal(pv.roleId, p.roleId)
    else assert.equal(pv.roleId, null)
    if (p.id !== viewer.id) for (const c of p.hand) assert.ok(!json.includes(`"${c.id}"`), 'carte adverse fuitée')
  }
  assert.equal(v.players.find(p => p.id === viewer.id)!.handCount, viewer.hand.length)
  assert.ok(!json.includes('"deck"'), 'la pioche ne doit pas fuiter')
})

test('attaque : la cible peut bloquer avec une Voile, le tour passe ensuite', () => {
  const rand = seeded(11)
  const s = setupGame({ playerNames: names(4), rand, shipIds: ['fregate', 'galion', 'sloop', 'brick'] })
  advance(s, { rand, now: 0 })
  const a = currentPlayer(s)!
  const t = s.players.find(p => p.id !== a.id)!
  a.hand = [CARDS.find(c => c.name === 'Coup de sabre')!]
  t.hand = [CARDS.find(c => c.name === 'Voile rapide')!]
  applyAction(s, a.id, { type: 'coins' }, { rand, now: 0 })
  const hp = t.hp
  assert.ok(applyAction(s, a.id, { type: 'play', cardId: a.hand[0]!.id, targetId: t.id }, { rand, now: 0 }).ok)
  assert.equal(s.phase, 'reaction')
  assert.ok(applyAction(s, t.id, { type: 'react', defenseCardId: t.hand[0]!.id }, { rand, now: 0 }).ok)
  assert.equal(t.hp, hp)
  assert.notEqual(currentPlayer(s)!.id, a.id, 'le tour doit passer')
})

test('attaque sans réaction possible : résolue immédiatement', () => {
  const rand = seeded(12)
  const s = setupGame({ playerNames: names(4), rand, shipIds: ['fregate', 'galion', 'sloop', 'brick'] })
  advance(s, { rand, now: 0 })
  const a = currentPlayer(s)!
  const t = s.players.find(p => p.id !== a.id)!
  a.hand = [CARDS.find(c => c.name === 'Tir de canon')!]
  t.hand = []
  applyAction(s, a.id, { type: 'coins' }, { rand, now: 0 })
  const hp = t.hp
  applyAction(s, a.id, { type: 'play', cardId: a.hand[0]!.id, targetId: t.id }, { rand, now: 0 })
  assert.ok(t.hp < hp)
  assert.notEqual(s.phase, 'reaction')
})

test('réaction en retard : la cible est considérée passive', () => {
  const rand = seeded(13)
  const s = setupGame({ playerNames: names(4), rand, shipIds: ['fregate', 'galion', 'sloop', 'brick'], reactionSeconds: 20 })
  advance(s, { rand, now: 0 })
  const a = currentPlayer(s)!
  const t = s.players.find(p => p.id !== a.id)!
  a.hand = [CARDS.find(c => c.name === 'Coup de sabre')!]
  t.hand = [CARDS.find(c => c.name === 'Voile rapide')!]
  applyAction(s, a.id, { type: 'coins' }, { rand, now: 0 })
  applyAction(s, a.id, { type: 'play', cardId: a.hand[0]!.id, targetId: t.id }, { rand, now: 1000 })
  assert.equal(s.phase, 'reaction')
  const hp = t.hp
  processTimers(s, { rand, now: 1000 + 21_000 })
  assert.equal(t.hp, hp - 1)
  assert.equal(s.phase === 'reaction', false)
})

test('un joueur inactif 3 fois est retiré de la partie', () => {
  const rand = seeded(14)
  const s = setupGame({ playerNames: names(4), rand, turnSeconds: 30 })
  let now = 0
  advance(s, { rand, now })
  const afk = currentPlayer(s)!
  for (let i = 0; i < 200 && afk.isAlive && s.phase !== 'finished'; i++) {
    now += 31_000
    processTimers(s, { rand, now })
    // les autres jouent normalement leur tour
    const cur = currentPlayer(s)!
    if (cur.id !== afk.id && s.phase === 'draw') { applyAction(s, cur.id, { type: 'coins' }, { rand, now }); applyAction(s, cur.id, { type: 'end' }, { rand, now }) }
  }
  assert.equal(afk.isAlive, false)
})

test('salon : rejoindre, navires uniques, lancement à 4 joueurs minimum', () => {
  const room = newRoom('ABCD', 'u1', 'Alice')
  assert.ok(joinRoom(room, 'u2', 'Bob').ok)
  assert.equal(joinRoom(room, 'u3', 'bob').ok, false, 'pseudo doublon')
  assert.ok(joinRoom(room, 'u3', 'Cleo').ok)
  assert.equal(startRoom(room, 'u1').ok, false, 'moins de 4 joueurs')
  assert.ok(joinRoom(room, 'u4', 'Dan').ok)
  assert.ok(updateSeat(room, 'u2', { shipId: 'galion' }).ok)
  assert.equal(updateSeat(room, 'u3', { shipId: 'galion' }).ok, false, 'navire déjà pris')
  assert.equal(startRoom(room, 'u1').ok, false, 'pas tous prêts')
  for (const u of ['u2', 'u3', 'u4']) updateSeat(room, u, { ready: true })
  assert.equal(startRoom(room, 'u2').ok, false, 'seul l\'hôte lance')
  assert.ok(startRoom(room, 'u1').ok)
  assert.equal(room.status, 'playing')
  assert.equal(room.state!.players.find(p => p.id === 'u2')!.shipId, 'galion')
  assert.equal(viewForUser(room, 'u9'), null, 'un inconnu ne voit rien')
  assert.ok(joinRoom(room, 'u9', 'Zed').ok, 'partie commencée : on rejoint en spectateur')
  assert.equal(room.seats.some(s => s.userId === 'u9'), false)
  assert.ok(joinRoom(room, 'u2', 'Bob').ok, 'reconnexion autorisée')
  assert.equal((viewForUser(room, 'u2') as any).status, 'playing')
})

test('hôte qui quitte le salon : un autre devient hôte', () => {
  const room = newRoom('WXYZ', 'u1', 'A')
  joinRoom(room, 'u2', 'B')
  leaveLobby(room, 'u1')
  assert.equal(room.hostId, 'u2')
})

test('abandon du joueur actif pendant une réaction ne bloque pas la partie', () => {
  const rand = seeded(21)
  const s = setupGame({ playerNames: names(4), rand })
  advance(s, { rand, now: 0 })
  const a = currentPlayer(s)!
  const t = s.players.find(p => p.id !== a.id)!
  a.hand = [CARDS.find(c => c.name === 'Coup de sabre')!]
  t.hand = [CARDS.find(c => c.name === 'Voile rapide')!]
  applyAction(s, a.id, { type: 'coins' }, { rand, now: 0 })
  applyAction(s, a.id, { type: 'play', cardId: a.hand[0]!.id, targetId: t.id }, { rand, now: 0 })
  forfeit(s, a.id)
  advance(s, { rand, now: 0 })
  assert.notEqual(s.phase, 'reaction')
  assert.ok(currentPlayer(s)!.isAlive)
})
