export type CardType = 'ATTAQUE' | 'SOIN' | 'PROTECTION' | 'VOL' | 'OBJET';

export interface Card {
  id: string;
  name: string;
  description: string;
  type: CardType;
  value?: number; // Par exemple, points de dégâts ou de soin
}

export interface Role {
  id: string;
  name: string;
  mission: string;
  goalType: 'ELIMINATE' | 'PROTECT' | 'SURVIVE';
  targetId?: string; // Pour les missions de type PROTECT
}

export interface Character {
  id: string;
  name: string;
  power: string;
  powerDescription: string;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  secretRole: Role;
  hp: number;
  maxHp: number;
  cards: Card[];
  coins: number;
  isAlive: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  effect: string;
}

export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';

export interface GameState {
  id: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  shop: ShopItem[];
  currentPlayerIndex: number;
  status: GameStatus;
  winner?: string;
  turnPhase: 'DRAW' | 'ACTION' | 'ENDED';
  hasPlayedAttack: boolean;
}
