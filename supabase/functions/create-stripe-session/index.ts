import Stripe from 'https://esm.sh/stripe@17?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Catalogue produits (doit rester en sync avec src/lib/products.ts)
const products = [
  { id: 'jeu',       name: 'ChatBordage — Le jeu',    shortDesc: 'Le jeu de cartes à rôles cachés dans un univers de chats pirates.', price: 34.9  },
  { id: 'stickers',  name: 'Pack de 5 stickers',       shortDesc: 'Les 5 chats pirates en stickers vinyle waterproof.',                  price: 7.5   },
  { id: 'mug',       name: 'Mug Capitaine',             shortDesc: "Un mug 33cl à l'effigie de Chat-rles Henri.",                         price: 14.9  },
  { id: 'collector', name: 'Édition Collector',         shortDesc: 'La boîte du jeu, les 5 stickers, le mug et un set de cartes dorées.', price: 59.9  },
]

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-05-28.basil' })

    const body = await req.json()
    const cart: { id: string; quantity: number }[] = body?.cart ?? []

    if (!Array.isArray(cart) || cart.length === 0) {
      return new Response(JSON.stringify({ error: 'Panier vide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Construire les line_items Stripe
    const lineItems = []
    for (const entry of cart) {
      const product = products.find(p => p.id === entry.id)
      if (!product) continue
      const qty = Math.max(1, Math.min(99, Math.floor(entry.quantity)))
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: product.shortDesc.slice(0, 250),
          },
        },
      })
    }

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun produit valide dans le panier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const successUrl = Deno.env.get('CHECKOUT_SUCCESS_URL') || `${origin}/commande/merci`
    const cancelUrl  = Deno.env.get('CHECKOUT_CANCEL_URL')  || `${origin}/panier`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'NL', 'PT'],
      },
      locale: 'fr',
    })

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[create-stripe-session]', message)
    return new Response(JSON.stringify({ error: 'Erreur Stripe', detail: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
