import type { SeaEvent } from './types'

export const SEA_EVENTS: SeaEvent[] = [
  { id: 'calme', name: 'Mer calme', description: 'Aucun effet. Le tour se déroule normalement.', rarity: 'commun' },
  { id: 'tempete', name: 'Tempête', description: 'Chaque joueur perd 1 PV (minimum 1 PV restant).', rarity: 'commun' },
  { id: 'brume', name: 'Brume épaisse', description: 'Les attaques infligent -1 dégât ce tour (minimum 1).', rarity: 'commun' },
  { id: 'tresor', name: 'Île au trésor', description: 'Chaque joueur gagne 1 pièce.', rarity: 'commun' },
  { id: 'vents', name: 'Vents favorables', description: 'Le joueur actif pioche 1 carte supplémentaire en début de tour.', rarity: 'commun' },
  { id: 'sirenes', name: 'Chant des sirènes', description: 'Tout le monde révèle ou défausse 1 carte de sa main (au choix).', rarity: 'rare' },
  { id: 'mutinerie', name: 'Mutinerie', description: 'Le joueur actif doit donner 1 carte à son voisin de gauche.', rarity: 'rare' },
  { id: 'reflux', name: 'Reflux', description: 'Tout le monde se soigne de 1 PV.', rarity: 'rare' },
  { id: 'kraken', name: 'Le Kraken passe', description: 'Le joueur actif subit 2 dégâts s\'il joue une carte Attaque ce tour.', rarity: 'epique' },
  { id: 'aubaine', name: 'Aubaine', description: 'Les prix de la boutique sont réduits de 1 pièce ce tour (minimum 1).', rarity: 'epique' }
]

export function drawSeaEvent(rand: () => number = Math.random): SeaEvent {
  return SEA_EVENTS[Math.floor(rand() * SEA_EVENTS.length)]
}
