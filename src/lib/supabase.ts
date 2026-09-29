import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// Une valeur invalide (ex. le modèle « your_supabase_url ») est traitée comme « non configuré »
// plutôt que de faire planter toute l'application au démarrage.
export const supabaseConfigured = /^https?:\/\//.test(supabaseUrl) && !!supabaseAnonKey

if (!supabaseConfigured) {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — online mode disabled, preinscription mocked.')
}

export const supabase = createClient(supabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key')

export type Preinscription = {
  prenom: string
  nom: string
  email: string
}

export async function insertPreinscription(payload: Preinscription) {
  if (!supabaseConfigured) {
    console.info('[Supabase] Mock insert:', payload)
    return { data: payload, error: null }
  }
  return await supabase.from('preinscriptions').insert(payload)
}
