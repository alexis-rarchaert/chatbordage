import type { Role, RoleId, PlayerState, GameState } from './types.ts'
import { shuffle } from './cards.ts'

export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 8

export const ROLES: Role[] = [
  {
    id: 'capitaine',
    name: 'Capitaine',
    catName: 'Chat-rles Henri',
    catImage: '/chats/chat-rles-henri.png',
    isPublic: true,
    startingHpBonus: 1,
    mission: 'Survivre jusqu\'au duel final : tu gagnes dès qu\'il ne reste qu\'un seul autre joueur en vie que toi.'
  },
  {
    id: 'protecteur',
    name: 'Protecteur',
    catName: 'Miranda',
    catImage: '/chats/miranda.png',
    isPublic: false,
    startingHpBonus: 0,
    mission: 'Garder le Capitaine en vie jusqu\'à la fin. Si vous êtes les deux derniers en vie, vous gagnez ensemble.'
  },
  {
    id: 'chasseur',
    name: 'Chasseur de primes',
    catName: 'Kim',
    catImage: '/chats/kim.png',
    isPublic: false,
    startingHpBonus: 0,
    mission: 'Éliminer 2 navires ennemis avant tout le monde.'
  },
  {
    id: 'renegat',
    name: 'Renégat',
    catName: 'Sylas',
    catImage: '/chats/sylas.png',
    isPublic: false,
    startingHpBonus: 0,
    mission: 'Être le tout dernier survivant. Tous les autres joueurs doivent être éliminés.'
  },
  {
    id: 'contrebandier',
    name: 'Contrebandier',
    catName: 'Maskey',
    catImage: '/chats/maskey.png',
    isPublic: false,
    startingHpBonus: 0,
    mission: 'Accumuler 15 pièces, à n\'importe quel moment de la partie.'
  }
]

export function getRole(id: RoleId): Role {
  const r = ROLES.find(r => r.id === id)
  if (!r) throw new Error(`Role inconnu : ${id}`)
  return r
}

/**
 * Assigne 1 Capitaine + 1 Protecteur + 1 rôle "spoiler" tiré au sort,
 * et complète avec les rôles restants jusqu'à couvrir tous les joueurs.
 * À 4 joueurs : Capitaine + Protecteur + 2 rôles spoilers. Au-delà de 5 joueurs, des rôles spoilers sont dupliqués.
 */
export function assignRoles(playerCount: number, rand: () => number = Math.random): RoleId[] {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`ChatBordage se joue de ${MIN_PLAYERS} à ${MAX_PLAYERS} joueurs.`)
  }

  // Toujours 1 Capitaine et 1 Protecteur, puis on tire dans les "rôles libres"
  const free: RoleId[] = ['chasseur', 'renegat', 'contrebandier']
  const shuffled = shuffle(free, rand)
  const ids: RoleId[] = ['capitaine', 'protecteur', ...shuffled.slice(0, playerCount - 2)]

  // Si plus de joueurs que de rôles disponibles, on duplique un rôle spoiler aléatoire
  while (ids.length < playerCount) {
    ids.push(shuffled[Math.floor(rand() * shuffled.length)]!)
  }

  // On mélange l'attribution finale aux sièges
  return shuffle(ids, rand)
}

/**
 * Conditions de victoire (document de conception + livret de règles).
 * Il n'y a pas de priorité entre missions : la partie est vérifiée après CHAQUE événement (élimination,
 * gain de pièces…), donc la première mission réellement accomplie, dans l'ordre des actions, termine la partie.
 * L'ordre ci-dessous ne sert qu'à départager deux missions qui se réaliseraient dans un même instant.
 */
export function checkVictory(state: GameState): { winners: PlayerState[]; reason: string } | null {
  const alive = state.players.filter(p => p.isAlive)

  // Contrebandier : 15 pièces atteintes à tout moment
  for (const p of state.players) {
    if (p.roleId === 'contrebandier' && p.coins >= 15) {
      return { winners: [p], reason: `${p.name} (Contrebandier) a empilé 15 pièces.` }
    }
  }

  // Chasseur de primes : a éliminé 2 ennemis avant tout le monde
  for (const p of state.players) {
    if (p.roleId === 'chasseur' && p.eliminationsCount >= 2) {
      return { winners: [p], reason: `${p.name} (Chasseur de primes) a coulé 2 navires.` }
    }
  }

  // Duel final : il ne reste qu'un seul autre joueur que le Capitaine → le Capitaine a survécu.
  // Le Protecteur gagne avec lui s'il est encore en vie.
  const cap = alive.find(p => p.roleId === 'capitaine')
  if (cap && alive.length <= 2) {
    const prot = alive.find(p => p.roleId === 'protecteur')
    return prot
      ? { winners: [cap, prot], reason: `${cap.name} (Capitaine) et ${prot.name} (Protecteur) survivent ensemble au duel final.` }
      : { winners: [cap], reason: `${cap.name} (Capitaine) survit jusqu'au duel final.` }
  }

  // Capitaine éliminé : on joue jusqu'au dernier survivant (Renégat, ou à défaut le dernier debout).
  if (alive.length === 1) {
    const last = alive[0]!
    return last.roleId === 'renegat'
      ? { winners: [last], reason: `${last.name} (Renégat) est le dernier survivant.` }
      : { winners: [last], reason: `${last.name} est le dernier survivant.` }
  }

  return null
}
