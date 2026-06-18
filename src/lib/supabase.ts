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

export async function verifyActivationCode(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase()
  if (!supabaseUrl || !supabaseAnonKey) {
    console.info('[Supabase] Mock verification for code:', normalizedCode)
    const mockCodes = [
      'ABCD-1234-EFGH-5678',
      'CHAT-BORD-AGE2-2026',
      'PIRA-TECA-T202-2026',
      'NOTA-BLBO-ARDG-2026'
    ]
    return mockCodes.includes(normalizedCode)
  }

  try {
    const { data, error } = await supabase
      .from('activation_codes')
      .select('code')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (error) {
      console.error('[Supabase] Error verifying code:', error)
      return false
    }
    return !!data
  } catch (err) {
    console.error('[Supabase] Catch error verifying code:', err)
    return false
  }
}
