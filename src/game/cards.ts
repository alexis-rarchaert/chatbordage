import type { Card, Family } from './types'

type CardDef = Omit<Card, 'id'> & { id?: string }

const RAW: CardDef[] = [
  // ABORDAGES (attaque)
  { name: 'Coup de sabre',     family: 'ABORDAGE', description: 'Inflige 1 dégât à un joueur.',                                   rarity: 'commun', copies: 12, damage: 1 },
  { name: 'Tir de canon',      family: 'ABORDAGE', description: 'Inflige 2 dégâts à un joueur.',                                  rarity: 'commun', copies: 8,  damage: 2 },
  { name: 'Coup de griffe',    family: 'ABORDAGE', description: 'Inflige 1 dégât (ignore les Voiles).',                           rarity: 'rare',   copies: 4,  damage: 1, effect: 'PIERCE' },
  { name: 'Mitraille',         family: 'ABORDAGE', description: 'Inflige 1 dégât à tous les autres joueurs.',                     rarity: 'epique', copies: 2,  damage: 1, effect: 'AOE' },
  { name: 'Tir groupé',        family: 'ABORDAGE', description: 'Inflige 1 dégât à 2 joueurs au choix.',                          rarity: 'rare',   copies: 3,  damage: 1, effect: 'MULTI_2' },

  // VOILES (défense — jouable en réaction à une attaque)
  { name: 'Voile rapide',      family: 'VOILE',    description: 'Annule l\'attaque qui te cible.',                                rarity: 'commun', copies: 10, effect: 'BLOCK' },
  { name: 'Esquive féline',    family: 'VOILE',    description: 'Annule une attaque et renvoie 1 dégât à l\'assaillant.',         rarity: 'rare',   copies: 3,  damage: 1, effect: 'BLOCK_REFLECT' },
  { name: 'Cape de brume',     family: 'VOILE',    description: 'Réduit de 2 les dégâts subis (minimum 1).',                      rarity: 'commun', copies: 4,  effect: 'REDUCE_2' },

  // MARÉES (soin / pioche)
  { name: 'Rhum',              family: 'MAREE',    description: 'Restaure 1 PV.',                                                 rarity: 'commun', copies: 8,  heal: 1 },
  { name: 'Repos au port',     family: 'MAREE',    description: 'Restaure 2 PV (tu ne peux pas attaquer ce tour).',               rarity: 'rare',   copies: 3,  heal: 2, effect: 'NO_ATTACK_TURN' },
  { name: 'Coup de barre',     family: 'MAREE',    description: 'Pioche 2 cartes.',                                               rarity: 'commun', copies: 5,  effect: 'DRAW_2' },

  // RUMEURS (bluff / info / vol)
  { name: 'Vol à la tire',     family: 'RUMEUR',   description: 'Vole 1 carte au hasard à un joueur.',                            rarity: 'commun', copies: 5,  effect: 'STEAL_CARD' },
  { name: 'Longue-vue',        family: 'RUMEUR',   description: 'Regarde la main d\'un joueur.',                                  rarity: 'commun', copies: 4,  effect: 'PEEK_HAND' },
  { name: 'Trahison',          family: 'RUMEUR',   description: 'Échange ta main avec celle d\'un joueur ciblé.',                 rarity: 'epique', copies: 1,  effect: 'SWAP_HAND' },
  { name: 'Murmure',           family: 'RUMEUR',   description: 'Cible un joueur : il doit te révéler son rôle en secret.',       rarity: 'rare',   copies: 2,  effect: 'PEEK_ROLE' },
  { name: 'Pavillon noir',     family: 'RUMEUR',   description: 'Cible un joueur : il défausse 1 carte au hasard.',               rarity: 'rare',   copies: 3,  effect: 'DISCARD_RANDOM' },
  { name: 'Sabotage',          family: 'RUMEUR',   description: 'Détruit 1 carte Trésor d\'un joueur ciblé.',                     rarity: 'rare',   copies: 3,  effect: 'DESTROY_TREASURE' },

  // TRÉSORS (équipement permanent)
  { name: 'Coque renforcée',   family: 'TRESOR',   description: 'Permanent : +1 PV max au moment où tu la poses.',                 rarity: 'rare',   copies: 3,  permanent: true, effect: 'PERM_MAXHP_1' },
  { name: 'Pavois doré',       family: 'TRESOR',   description: 'Permanent : la première attaque par tour est réduite de 1.',     rarity: 'rare',   copies: 2,  permanent: true, effect: 'PERM_ARMOR_FIRST' },
  { name: 'Lunette d\'approche', family: 'TRESOR', description: 'Permanent : à chaque tour, regarde la première carte de la pioche.', rarity: 'rare', copies: 2, permanent: true, effect: 'PERM_SCRY' },
  { name: 'Cale',              family: 'TRESOR',   description: 'Permanent : gagne 1 pièce par tour.',                            rarity: 'epique', copies: 2,  permanent: true, effect: 'PERM_COIN_PER_TURN' },
  { name: 'Étendard',          family: 'TRESOR',   description: 'Permanent : +1 dégât sur toutes tes attaques.',                  rarity: 'epique', copies: 2,  permanent: true, effect: 'PERM_DMG_1' }
]

export const CARDS: Card[] = RAW.flatMap(def => {
  return Array.from({ length: def.copies }, (_, i) => ({
    ...def,
    id: `${def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`
  })) as Card[]
})

export function totalCardCount(): number {
  return CARDS.length
}

export function familyCount(family: Family): number {
  return CARDS.filter(c => c.family === family).length
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function freshDeck(rand: () => number = Math.random): Card[] {
  return shuffle(CARDS, rand)
}
