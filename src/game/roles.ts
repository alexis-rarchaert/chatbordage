import type { Role, RoleId, PlayerState, GameState } from './types'

export const ROLES: Role[] = [
  {
    id: 'capitaine',
    name: 'Capitaine',
    catName: 'Chat-rles Henri',
    catImage: '/chats/chat-rles-henri.png',
    isPublic: true,
    startingHpBonus: 1,
    mission: 'Survivre jusqu\'au duel final. Tu gagnes si, à la fin, il ne reste que toi-même et ton Protecteur.'
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
 * À 4 joueurs : Capitaine + Protecteur + 2 rôles spoilers. À 6 joueurs : les 5 + un doublon.
 */
export function assignRoles(playerCount: number, rand: () => number = Math.random): RoleId[] {
  if (playerCount < 4 || playerCount > 6) {
    throw new Error('ChatBordage se joue de 4 à 6 joueurs.')
  }

  // Toujours 1 Capitaine et 1 Protecteur, puis on tire dans les "rôles libres"
  const free: RoleId[] = ['chasseur', 'renegat', 'contrebandier']
  const shuffled = [...free].sort(() => rand() - 0.5)
  const ids: RoleId[] = ['capitaine', 'protecteur', ...shuffled.slice(0, playerCount - 2)]

  // Si plus de joueurs que de rôles disponibles, on duplique un rôle spoiler aléatoire
  while (ids.length < playerCount) {
    ids.push(shuffled[Math.floor(rand() * shuffled.length)])
  }

  // On mélange l'attribution finale aux sièges
  return ids.sort(() => rand() - 0.5)
}

/** Renvoie l'id du joueur gagnant (ou liste de gagnants) si une condition est remplie. */
export function checkVictory(state: GameState): { winners: PlayerState[]; reason: string } | null {
  const alive = state.players.filter(p => p.isAlive)

  // Contrebandier : 15 pièces atteintes à tout moment
  for (const p of state.players) {
    if (p.roleId === 'contrebandier' && p.coins >= 15) {
      return { winners: [p], reason: `${p.name} (Contrebandier) a empilé 15 pièces.` }
    }
  }

  // Chasseur de primes : a éliminé 2 ennemis
  for (const p of state.players) {
    if (p.roleId === 'chasseur' && p.eliminationsCount >= 2) {
      return { winners: [p], reason: `${p.name} (Chasseur de primes) a coulé 2 navires.` }
    }
  }

  // Capitaine + Protecteur : il ne reste qu'eux deux (ou eux seul si protecteur mort mais capitaine seul)
  if (alive.length === 2) {
    const cap = alive.find(p => p.roleId === 'capitaine')
    const prot = alive.find(p => p.roleId === 'protecteur')
    if (cap && prot) {
      return { winners: [cap, prot], reason: `${cap.name} (Capitaine) et ${prot.name} (Protecteur) survivent ensemble.` }
    }
  }

  // Renégat : seul survivant
  if (alive.length === 1) {
    const last = alive[0]
    if (last.roleId === 'renegat') {
      return { winners: [last], reason: `${last.name} (Renégat) est le dernier survivant.` }
    }
    // Capitaine seul (protecteur déjà mort) — il gagne quand même selon le livret
    if (last.roleId === 'capitaine') {
      return { winners: [last], reason: `${last.name} (Capitaine) reste le dernier debout.` }
    }
  }

  return null
}
