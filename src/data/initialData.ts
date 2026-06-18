import { Card, Role, Character, ShopItem } from '../models/types';

export const INITIAL_CARDS: Card[] = [
  { id: 'c1', name: 'Sabre', description: 'Inflige 1 point de dégât', type: 'ATTAQUE', value: 1 },
  { id: 'c2', name: 'Canon', description: 'Inflige 2 points de dégâts', type: 'ATTAQUE', value: 2 },
  { id: 'c3', name: 'Rhum', description: 'Soigne 1 point de vie', type: 'SOIN', value: 1 },
  { id: 'c4', name: 'Bouclier', description: 'Protège de la prochaine attaque', type: 'PROTECTION' },
  { id: 'c5', name: 'Vol à la tire', description: 'Vole une carte à un adversaire', type: 'VOL' },
];

export const INITIAL_ROLES: Role[] = [
  { id: 'r1', name: 'Pirate', mission: 'Éliminer tous les autres joueurs', goalType: 'SURVIVE' },
  { id: 'r2', name: 'Capitaine', mission: 'Être le dernier survivant', goalType: 'SURVIVE' },
  { id: 'r3', name: 'Moussaillon', mission: 'Protéger le Capitaine', goalType: 'PROTECT' },
];

export const INITIAL_CHARACTERS: Character[] = [
  { id: 'ch1', name: 'Barbe Rousse', power: 'Force brute', powerDescription: '+1 dégât sur les attaques' },
  { id: 'ch2', name: 'Anne Bonny', power: 'Agilité', powerDescription: 'Peut piocher 3 cartes au lieu de 2' },
  { id: 'ch3', name: 'Jack Sparrow', power: 'Chance', powerDescription: '50% de chance d\'esquiver une attaque' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 's1', name: 'Full Vie', price: 10, effect: 'Restaure tous les points de vie' },
  { id: 's2', name: 'Plus de dégâts', price: 10, effect: '+1 dégât permanent' },
  { id: 's3', name: 'Plus de cartes', price: 10, effect: 'Piocher 3 cartes immédiatement' },
  { id: 's4', name: 'Voir un rôle', price: 10, effect: 'Regarder le rôle d\'un autre joueur' },
  { id: 's5', name: 'Revivre', price: 10, effect: 'Revient à la vie avec 1 HP à la prochaine élimination' },
];
