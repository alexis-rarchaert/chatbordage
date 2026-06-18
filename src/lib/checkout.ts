import { loadStripe, type Stripe } from '@stripe/stripe-js'

const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined

// URL de la Supabase Edge Function (définie dans .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function getEdgeFunctionUrl(): string | null {
  if (!supabaseUrl) {
    console.warn('[Checkout] VITE_SUPABASE_URL manquant')
    return null
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-stripe-session`
}

let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!publicKey) {
    console.warn('[Stripe] VITE_STRIPE_PUBLIC_KEY missing')
    return Promise.resolve(null)
  }
  if (!stripePromise) stripePromise = loadStripe(publicKey)
  return stripePromise
}

export type CheckoutPayload = { id: string; quantity: number }[]

export async function startCheckout(cart: CheckoutPayload): Promise<{ ok: boolean; error?: string }> {
  if (!cart.length) return { ok: false, error: 'Panier vide' }

  const url = getEdgeFunctionUrl()
  if (!url) return { ok: false, error: 'Configuration Supabase manquante (VITE_SUPABASE_URL)' }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (supabaseAnonKey) {
      headers['apikey'] = supabaseAnonKey
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cart }),
    })

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return { ok: false, error: `Réponse inattendue du serveur (HTTP ${res.status})` }
    }

    const data = await res.json()

    if (!res.ok) {
      return { ok: false, error: data?.error || `HTTP ${res.status}` }
    }

    const { id, url: sessionUrl } = data as { id: string; url?: string }

    // Stripe retourne l'URL directe → redirection simple
    if (sessionUrl) {
      window.location.href = sessionUrl
      return { ok: true }
    }

    // Fallback : redirectToCheckout avec l'ID de session
    const stripe = await getStripe()
    if (!stripe) return { ok: false, error: 'Stripe non chargé (clé publique manquante)' }

    const { error } = await stripe.redirectToCheckout({ sessionId: id })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau'
    return { ok: false, error: message }
  }
}

export async function getSessionStatus(id: string) {
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL manquant')

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/get-stripe-session?id=${encodeURIComponent(id)}`
  const headers: Record<string, string> = {}
  if (supabaseAnonKey) {
    headers['apikey'] = supabaseAnonKey
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as {
    status: string | null
    payment_status: string
    amount_total: number | null
    currency: string | null
    customer_email: string | null
  }
}
