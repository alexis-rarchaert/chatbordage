import { supabase, supabaseConfigured } from './supabase'
import { ensureSession } from './online'

/**
 * Accès au mode COMPAGNON (le mode en ligne reste gratuit et sans code).
 * Tout est vérifié côté serveur (fonctions SQL redeem_activation_code / has_companion_access) :
 * le navigateur n'a aucun accès à la table des codes. L'appareil est identifié par son compte anonyme.
 */
export type RedeemResult = { ok: true; remaining?: number } | { ok: false; error: string }

/** Cet appareil a-t-il déjà activé un code ? Sans serveur configuré (développement), l'accès est libre. */
export async function checkCompanionAccess(): Promise<boolean> {
  if (!supabaseConfigured) return true
  try {
    await ensureSession()
    const { data, error } = await supabase.rpc('has_companion_access')
    return !error && data === true
  } catch {
    return false
  }
}

export async function redeemCode(code: string): Promise<RedeemResult> {
  if (!supabaseConfigured) return { ok: true }
  try {
    await ensureSession()
    const { data, error } = await supabase.rpc('redeem_activation_code', { p_code: code })
    if (error) return { ok: false, error: 'network' }
    return data as RedeemResult
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === 'auth_disabled' ? 'auth_disabled' : 'network' }
  }
}
