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
  noAttackThisTurn?: boolean
  idleStrikes?: number
}

export type GamePhase = 'lobby' | 'event' | 'draw' | 'action' | 'reaction' | 'power' | 'end' | 'finished'

/** Réaction d'une cible à une attaque : carte Voile, esquive de la Corvette, ou rien (absent = pas encore répondu). */
export interface AttackResponse {
  defenseCardId?: string
  dodge?: boolean
}

export interface PendingAttack {
  kind: 'attack'
  attackerId: string
  card: Card
  targetIds: string[]
  responses: Record<string, AttackResponse>
  deadline: number
}

/** Jonque : le joueur a vu la carte du dessus et doit décider de la garder ou de la remettre dessous. */
export interface PendingScry {
  kind: 'scry'
  playerId: string
}

export type Pending = PendingAttack | PendingScry

export interface ChatMessage {
  id: number
  playerId: string
  key: string
}

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
  pending?: Pending
  /** Informations privées (résultat d'une longue-vue, d'une Jonque…), indexées par joueur. */
  notes: Record<string, string[]>
  chat: ChatMessage[]
  turnNumber: number
  /** Durée d'un tour / d'une réaction en secondes. 0 = pas de minuteur. */
  turnSeconds: number
  reactionSeconds: number
  turnDeadline?: number
}
