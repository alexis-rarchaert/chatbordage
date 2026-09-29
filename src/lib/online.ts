import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'
import type { Action, GameView, LobbyView } from '../game'

export type RoomView = (LobbyView | GameView) & { version?: number }

export type CallResult = { ok: true; roomCode?: string; view?: RoomView; left?: boolean } | { ok: false; error: string }

export const STORAGE = {
  room: 'chatbordage.room',
  name: 'chatbordage.name'
}

export const safeGet = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
export const safeSet = (k: string, v: string | null) => {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* stockage indisponible */ }
}

/** Session anonyme : l'identité d'un joueur survit aux rechargements (reconnexion automatique). */
export async function ensureSession(): Promise<string> {
  if (!supabaseConfigured) throw new Error('offline_unavailable')
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user.id
  const { data: created, error } = await supabase.auth.signInAnonymously()
  if (error || !created.user) throw new Error('auth_disabled')
  return created.user.id
}

export async function callGame(payload: Record<string, unknown>): Promise<CallResult> {
  const { data, error } = await supabase.functions.invoke('game', { body: payload })
  if (error) return { ok: false, error: 'network' }
  return data as CallResult
}

export const sendAction = (roomCode: string, action: Action) => callGame({ op: 'act', roomCode, action })

/**
 * Abonnement temps réel à SA vue (RLS : un joueur ne voit que sa ligne de `game_views`).
 * Renvoie une fonction de désabonnement.
 */
export function watchView(userId: string, onView: (v: RoomView) => void, onStatus: (connected: boolean) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`game-view-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_views', filter: `user_id=eq.${userId}` }, payload => {
      const row = payload.new as { view?: RoomView } | undefined
      if (row?.view) onView(row.view)
    })
    .subscribe(status => onStatus(status === 'SUBSCRIBED'))
  return () => { supabase.removeChannel(channel) }
}
