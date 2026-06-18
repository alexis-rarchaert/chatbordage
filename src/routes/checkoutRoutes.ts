import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { products, type Product } from '../lib/products'

const router = Router()

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY missing — /api/checkout endpoints will return 500.')
}
const stripe = stripeKey ? new Stripe(stripeKey) : null

type CartPayload = { id: string; quantity: number }[]

function buildLineItems(cart: CartPayload): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const entry of cart) {
    const product: Product | undefined = products.find(p => p.id === entry.id)
    if (!product) continue
    const qty = Math.max(1, Math.min(99, Math.floor(entry.quantity)))
    lines.push({
      quantity: qty,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.shortDesc.slice(0, 250)
        }
      }
    })
  }
  return lines
}

/**
 * @swagger
 * /api/checkout/create-session:
 *   post:
 *     summary: Crée une session Stripe Checkout pour le panier passé en body
 */
router.post('/create-session', async (req: Request, res: Response) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe non configuré côté serveur' })

  const cart = req.body?.cart as CartPayload | undefined
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Panier vide' })
  }

  const lineItems = buildLineItems(cart)
  if (lineItems.length === 0) {
    return res.status(400).json({ error: 'Aucun produit valide dans le panier' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: (process.env.CHECKOUT_SUCCESS_URL || 'http://localhost:5173/commande/merci') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CHECKOUT_CANCEL_URL || 'http://localhost:5173/panier',
      shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'NL', 'PT'] },
      locale: 'fr'
    })

    return res.json({ id: session.id, url: session.url })
  } catch (err: any) {
    console.error('[Stripe] create-session error:', err?.message ?? err)
    return res.status(500).json({ error: 'Erreur Stripe', detail: err?.message })
  }
})

/**
 * @swagger
 * /api/checkout/session/{id}:
 *   get:
 *     summary: Récupère une session Stripe (pour la page de confirmation)
 */
router.get('/session/:id', async (req: Request, res: Response) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe non configuré' })
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id)
    res.json({
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email
    })
  } catch (err: any) {
    res.status(404).json({ error: 'Session introuvable' })
  }
})

export default router
