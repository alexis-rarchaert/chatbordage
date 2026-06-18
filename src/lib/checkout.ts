import { loadStripe, type Stripe } from '@stripe/stripe-js'

const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined

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

  try {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body?.error || `HTTP ${res.status}` }
    }

    const data = (await res.json()) as { id: string; url?: string }

    if (data.url) {
      window.location.href = data.url
      return { ok: true }
    }

    const stripe = await getStripe()
    if (!stripe) return { ok: false, error: 'Stripe non chargé (clé publique manquante)' }

    const { error } = await stripe.redirectToCheckout({ sessionId: data.id })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erreur réseau' }
  }
}

export async function getSessionStatus(id: string) {
  const res = await fetch(`/api/checkout/session/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as {
    status: string | null
    payment_status: string
    amount_total: number | null
    currency: string | null
    customer_email: string | null
  }
}
