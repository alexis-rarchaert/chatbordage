export type Family = 'ABORDAGE' | 'VOILE' | 'MAREE' | 'RUMEUR' | 'TRESOR'
export type Rarity = 'commun' | 'rare' | 'epique'
export type PowerType = 'passif' | 'actif-tour' | 'actif-partie' | 'passif-trigger'

export interface Ship {
  id: string
  name: string
  image: string
  hp: number
  damage: number
  powerType: PowerType
  powerLabel: string
  powerDescription: string
}

export type RoleId = 'capitaine' | 'protecteur' | 'chasseur' | 'renegat' | 'contrebandier'

export interface Role {
  id: RoleId
  name: string
  catName: string
  catImage: string
  isPublic: boolean
  startingHpBonus: number
  mission: string
}

export interface Card {
  id: string
  name: string
  family: Family
  description: string
  rarity: Rarity
  copies: number
  damage?: number
  heal?: number
  permanent?: boolean
  effect?: string
}

export interface SeaEvent {
  id: string
  name: string
  description: string
  rarity: Rarity
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  oneShot: boolean
  effect: string
}

export interface PlayerState {
  id: string
  name: string
  shipId: string
  roleId: RoleId
  hp: number
  maxHp: number
  hand: Card[]
  permanents: Card[]
  coins: number
  isAlive: boolean
  eliminationsCount: number
  shieldPending?: boolean
  truceTurnsLeft?: number
  buffNextAttack?: number
  revivePending?: boolean
  powerUsedThisTurn?: boolean
  powerUsedThisGame?: boolean
}

export type GamePhase = 'lobby' | 'event' | 'draw' | 'action' | 'power' | 'end' | 'finished'

export interface GameState {
  id: string
  players: PlayerState[]
  deck: Card[]
  discard: Card[]
  shop: ShopItem[]
  events: SeaEvent[]
  currentEvent?: SeaEvent
  currentPlayerIndex: number
  phase: GamePhase
  hasPlayedAttack: boolean
  winnerIds?: string[]
  log: string[]
}
