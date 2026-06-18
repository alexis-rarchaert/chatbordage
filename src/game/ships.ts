import type { Ship } from './types'

export const SHIPS: Ship[] = [
  {
    id: 'fregate', name: 'La Frégate', image: '/bateaux/Fregate.webp',
    hp: 6, damage: 1, powerType: 'passif-trigger',
    powerLabel: 'Tribut sanglant',
    powerDescription: '+1 PV à chaque élimination ennemie.'
  },
  {
    id: 'galion', name: 'Le Galion', image: '/bateaux/Galion.webp',
    hp: 5, damage: 2, powerType: 'passif',
    powerLabel: 'Cale spacieuse',
    powerDescription: 'Main maximale portée à 6 cartes.'
  },
  {
    id: 'corvette', name: 'La Corvette', image: '/bateaux/Corvette.webp',
    hp: 4, damage: 1, powerType: 'actif-partie',
    powerLabel: 'Esquive royale',
    powerDescription: 'Esquive complètement une attaque. Utilisable 1× par partie.'
  },
  {
    id: 'fantome', name: 'Le Vaisseau Fantôme', image: '/bateaux/Vaisseau_Fantôme.webp',
    hp: 5, damage: 1, powerType: 'passif',
    powerLabel: 'Brouillard d\'âmes',
    powerDescription: 'Ton rôle ne peut jamais être révélé par l\'ennemi.'
  },
  {
    id: 'caravelle', name: 'La Caravelle', image: '/bateaux/Caravelle.webp',
    hp: 5, damage: 1, powerType: 'passif',
    powerLabel: 'Pioche favorable',
    powerDescription: 'Pioche 1 carte supplémentaire gratuite chaque tour.'
  },
  {
    id: 'sloop', name: 'Le Sloop', image: '/bateaux/sloop.webp',
    hp: 4, damage: 1, powerType: 'actif-tour',
    powerLabel: 'Bourse aléatoire',
    powerDescription: 'Échange une carte de ta main contre une carte au hasard de la pioche. 1× par tour.'
  },
  {
    id: 'brick', name: 'Le Brick', image: '/bateaux/brick.webp',
    hp: 5, damage: 1, powerType: 'passif-trigger',
    powerLabel: 'Compensation',
    powerDescription: 'Quand tu es attaqué, pioche 1 carte.'
  },
  {
    id: 'jonque', name: 'La Jonque', image: '/bateaux/jonque.webp',
    hp: 4, damage: 1, powerType: 'actif-tour',
    powerLabel: 'Œil aiguisé',
    powerDescription: 'Regarde la carte du dessus de la pioche ; garde-la ou remets-la dessous. 1× par tour.'
  },
  {
    id: 'trois-mats', name: 'Le Trois-Mâts', image: '/bateaux/trois-mats.webp',
    hp: 6, damage: 1, powerType: 'passif',
    powerLabel: 'Cale forte',
    powerDescription: 'Tes cartes Équipement ne peuvent pas être détruites.'
  },
  {
    id: 'felouque', name: 'La Felouque', image: '/bateaux/felouque.webp',
    hp: 4, damage: 2, powerType: 'passif-trigger',
    powerLabel: 'Loi de la jungle',
    powerDescription: 'Si tu attaques un joueur qui a plus de PV que toi, +1 dégât bonus.'
  },
  {
    id: 'cotre', name: 'Le Cotre', image: '/bateaux/cotre.webp',
    hp: 5, damage: 1, powerType: 'actif-partie',
    powerLabel: 'Tour de passe-patte',
    powerDescription: 'Vole 1 carte au hasard dans la main d\'un adversaire. 1× par partie.'
  },
  {
    id: 'brigantin', name: 'Le Brigantin', image: '/bateaux/brigantin.webp',
    hp: 4, damage: 1, powerType: 'passif-trigger',
    powerLabel: 'Charognard',
    powerDescription: 'Quand tu élimines un joueur, pioche 2 cartes en bonus.'
  },
  {
    id: 'clipper', name: 'Le Clipper', image: '/bateaux/clipper.webp',
    hp: 4, damage: 1, powerType: 'actif-tour',
    powerLabel: 'Marchand sage',
    powerDescription: 'Si tu n\'as joué aucune carte Attaque ce tour, gagne 1 pièce bonus.'
  },
  {
    id: 'gabare', name: 'La Gabare', image: '/bateaux/gabare.webp',
    hp: 5, damage: 1, powerType: 'passif-trigger',
    powerLabel: 'Bourse pleine',
    powerDescription: 'Gagne 1 pièce supplémentaire chaque fois que tu choisis l\'option pièces.'
  },
  {
    id: 'cuirasse', name: 'Le Cuirassé', image: '/bateaux/cuirasse.webp',
    hp: 7, damage: 1, powerType: 'passif',
    powerLabel: 'Blindage',
    powerDescription: '-1 dégât sur toutes les attaques reçues (minimum 1).'
  }
]

export function getShip(id: string): Ship | undefined {
  return SHIPS.find(s => s.id === id)
}
