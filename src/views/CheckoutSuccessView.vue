<template>
  <div class="success-page">
    <SiteHeader />

    <main class="success-main container">
      <div class="success-card" v-reveal="'zoom'">
        <div class="success-icon" aria-hidden="true">⚓</div>
        <h1 class="success-title">Merci, moussaillon !</h1>

        <div v-if="loading" class="success-loading">Vérification du paiement…</div>

        <template v-else-if="status">
          <p class="success-lead">
            Ton paiement est <strong>{{ status.payment_status === 'paid' ? 'confirmé' : status.payment_status }}</strong>.
          </p>
          <div v-if="status.amount_total != null" class="success-amount">
            Montant : <strong>{{ formatAmount(status.amount_total, status.currency) }}</strong>
          </div>
          <p v-if="status.customer_email" class="success-email">
            Un récap part vers <strong>{{ status.customer_email }}</strong>.
          </p>
        </template>

        <template v-else>
          <p class="success-lead">Ton paiement de test a été enregistré.</p>
        </template>

        <p class="success-note">
          Pendant qu'on prépare l'expédition, hisse la grand-voile : explore les règles ou la boutique.
        </p>

        <div class="success-actions">
          <RouterLink to="/" class="btn-primary">Retour à l'accueil</RouterLink>
          <RouterLink to="/reglement" class="success-link">Lire le règlement</RouterLink>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { getSessionStatus } from '../lib/checkout'
import { useCart } from '../lib/cart'

const route = useRoute()
const cart = useCart()

const loading = ref(true)
const status = ref<Awaited<ReturnType<typeof getSessionStatus>> | null>(null)

function formatAmount(amount: number, currency: string | null) {
  const c = (currency || 'eur').toUpperCase()
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(amount / 100)
}

onMounted(async () => {
  const sessionId = route.query.session_id
  if (!sessionId) {
    loading.value = false
    return
  }
  try {
    status.value = await getSessionStatus(String(sessionId))
    if (status.value.payment_status === 'paid') cart.clear()
  } catch {
    // garde l'écran de remerciement même si la requête fail
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.success-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.success-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(40px, 6vw, 80px) 20px;
}
.success-card {
  max-width: 560px;
  width: 100%;
  text-align: center;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  background-image:
    linear-gradient(160deg, rgba(79, 18, 25, 0.94) 0%, rgba(60, 12, 18, 0.94) 100%),
    url('/paper.png');
  background-size: 100% 100%, cover;
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
}
.success-icon {
  font-size: 72px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}
.success-title {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(36px, 5vw, 52px);
  letter-spacing: 0.03em;
  margin-bottom: 24px;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.success-lead { font-size: 17px; line-height: 1.7; margin-bottom: 12px; }
.success-lead :deep(strong) { color: var(--color-turquoise); }
.success-amount {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 26px;
  margin: 12px 0;
}
.success-email { font-size: 14px; color: var(--color-text-muted); margin-bottom: 16px; }
.success-note {
  font-style: italic;
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 24px 0;
  line-height: 1.6;
}
.success-loading { color: var(--color-text-muted); font-style: italic; }
.success-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 12px;
}
.success-link {
  align-self: center;
  color: var(--color-gold);
  font-size: 14px;
  text-decoration: underline;
}
</style>
