import { SHIPS, ROLES, type Card, type Family, type RoleId } from '../game'

export const FAMILY_META: Record<Family, { icon: string; color: string; key: string }> = {
  ABORDAGE: { icon: '⚔️', color: '#b3362f', key: 'abordage' },
  VOILE: { icon: '⛵', color: '#2d8a9a', key: 'voile' },
  MAREE: { icon: '🌊', color: '#3f8f5b', key: 'maree' },
  RUMEUR: { icon: '🗝️', color: '#7a4fa3', key: 'rumeur' },
  TRESOR: { icon: '💰', color: '#b8892b', key: 'tresor' }
}

/** Les clés i18n des navires n'ont pas de tiret (`troismats`), les ids du moteur oui (`trois-mats`). */
export const shipI18nKey = (id: string) => id.replace(/-/g, '')

export const shipOf = (id: string) => SHIPS.find(s => s.id === id)
export const roleOf = (id: RoleId) => ROLES.find(r => r.id === id)!

/** Une carte demande-t-elle de choisir une ou plusieurs cibles ? */
export function cardTargets(card: Card): 'none' | 'one' | 'two' {
  if (card.family === 'ABORDAGE') {
    if (card.effect === 'AOE') return 'none'
    return card.effect === 'MULTI_2' ? 'two' : 'one'
  }
  if (card.family === 'RUMEUR') return 'one'
  return 'none'
}

export const isPlayable = (card: Card) => card.family !== 'VOILE'

export const CHAT_EMOJIS = ['👍', '😹', '😱', '🏴‍☠️', '🤔', '🔪', '🙏', '⚓']
export const CHAT_PHRASES = ['traitor', 'gg', 'hurry', 'innocent']
