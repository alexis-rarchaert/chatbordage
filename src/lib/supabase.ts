import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — preinscription will be mocked.')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key')

export type Preinscription = {
  prenom: string
  nom: string
  email: string
}

export async function insertPreinscription(payload: Preinscription) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.info('[Supabase] Mock insert:', payload)
    return { data: payload, error: null }
  }
  return await supabase.from('preinscriptions').insert(payload)
}
