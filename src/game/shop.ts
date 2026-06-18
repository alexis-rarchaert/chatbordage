import type { ShopItem } from './types'

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'reparations',
    name: 'Réparations d\'urgence',
    description: 'Restaure tous tes PV au maximum.',
    price: 6,
    oneShot: true,
    effect: 'HEAL_FULL'
  },
  {
    id: 'poudre',
    name: 'Poudre noire',
    description: '+2 dégâts sur ta prochaine attaque.',
    price: 4,
    oneShot: true,
    effect: 'BUFF_NEXT_ATTACK_2'
  },
  {
    id: 'coffre',
    name: 'Coffre de contrebande',
    description: 'Pioche 3 cartes immédiatement (tu défausseras en fin de tour si tu dépasses la limite).',
    price: 5,
    oneShot: true,
    effect: 'DRAW_3'
  },
  {
    id: 'longue-vue',
    name: 'Longue-vue du traître',
    description: 'Révèle le rôle secret d\'un joueur (visible uniquement par toi).',
    price: 7,
    oneShot: true,
    effect: 'REVEAL_ROLE'
  },
  {
    id: 'treve',
    name: 'Drapeau de trêve',
    description: 'Personne ne peut t\'attaquer pendant 2 tours complets.',
    price: 6,
    oneShot: true,
    effect: 'TRUCE_2'
  },
  {
    id: 'revivre',
    name: 'Revivre une fois',
    description: 'Si tu es éliminé, tu reviens avec 1 PV (à activer immédiatement). Usage unique.',
    price: 8,
    oneShot: true,
    effect: 'REVIVE_PENDING'
  }
]

export function freshShop(): ShopItem[] {
  // Une seule occurrence de chaque item, partagée entre tous les joueurs : le premier qui achète le retire.
  return SHOP_ITEMS.map(i => ({ ...i }))
}
