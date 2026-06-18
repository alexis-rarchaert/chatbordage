<template>
  <div class="cart-page">
    <SiteHeader />

    <main class="cart-main container">
      <h1 class="cart-title">{{ $t('cart.title') }}</h1>

      <div v-if="lines.length === 0" class="cart-empty">
        <div class="cart-empty-icon" aria-hidden="true">🦴</div>
        <p>{{ $t('cart.empty') }}</p>
        <RouterLink to="/boutique" class="btn-primary">{{ $t('cart.goToShop') }}</RouterLink>
      </div>

      <div v-else class="cart-layout">
        <div class="cart-items">
          <article v-for="line in lines" :key="line.product.id" class="cart-line">
            <RouterLink :to="`/boutique/${line.product.slug}`" class="cart-line-media">
              <img v-if="line.product.image" :src="line.product.image" :alt="$t('products.' + line.product.id + '.name')" />
              <div v-else class="cart-line-placeholder">{{ line.product.icon }}</div>
            </RouterLink>

            <div class="cart-line-body">
              <RouterLink :to="`/boutique/${line.product.slug}`" class="cart-line-name">
                {{ $t('products.' + line.product.id + '.name') }}
              </RouterLink>
              <p class="cart-line-desc">{{ $t('products.' + line.product.id + '.shortDesc') }}</p>
              <div class="cart-line-unit">{{ formatPrice(line.product.price) }} {{ $t('cart.perUnit') }}</div>
            </div>

            <div class="cart-line-controls">
              <QuantitySelector
                :model-value="line.quantity"
                :min="1"
                :max="99"
                @update:model-value="v => cart.setQuantity(line.product.id, v)"
              />
              <button class="cart-line-remove" @click="cart.remove(line.product.id)" :aria-label="$t('cart.remove')">
                {{ $t('cart.remove') }}
              </button>
            </div>

            <div class="cart-line-subtotal">
              {{ formatPrice(line.subtotal) }}
            </div>
          </article>

          <button class="cart-clear" @click="onClear">{{ $t('cart.clear') }}</button>
        </div>

        <aside class="cart-summary">
          <h2>{{ $t('cart.summary') }}</h2>
          <div class="summary-row">
            <span>{{ $t('cart.itemsCount', { count: totalItems }) }}</span>
            <span>{{ formatPrice(totalPrice) }}</span>
          </div>
          <div class="summary-row">
            <span>{{ $t('cart.shipping') }}</span>
            <span class="summary-free">{{ $t('cart.free') }}</span>
          </div>
          <div class="summary-row total">
            <span>{{ $t('cart.total') }}</span>
            <span>{{ formatPrice(totalPrice) }}</span>
          </div>
          <button class="btn-primary summary-cta" @click="onCheckout" :disabled="!lines.length || checkoutLoading">
            {{ checkoutLoading ? $t('cart.redirecting') : $t('cart.checkout') }}
          </button>
          <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>
          <p class="summary-note">
            {{ $t('cart.securePaymentNote') }}
          </p>
          <RouterLink to="/boutique" class="summary-back">{{ $t('cart.continueShopping') }}</RouterLink>
        </aside>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import { ref } from 'vue'
import { useCart } from '../lib/cart'
import { formatPrice } from '../lib/products'
import { startCheckout } from '../lib/checkout'

const { t } = useI18n()
const cart = useCart()
const { lines, totalItems, totalPrice } = cart
const router = useRouter()

const checkoutLoading = ref(false)
const checkoutError = ref('')

function onClear() {
  if (confirm(t('cart.confirmClear'))) cart.clear()
}

async function onCheckout() {
  checkoutError.value = ''
  checkoutLoading.value = true
  const payload = lines.value.map(l => ({ id: l.product.id, quantity: l.quantity }))
  const { ok, error } = await startCheckout(payload)
  if (!ok) {
    checkoutError.value = error || t('cart.error')
    checkoutLoading.value = false
  }
}
</script>

<style scoped>
.cart-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.cart-main {
  padding: clamp(32px, 5vw, 56px) 20px;
  flex: 1;
}
.cart-title {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(36px, 5vw, 52px);
  margin-bottom: 32px;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}

.cart-empty {
  text-align: center;
  padding: 64px 20px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.7) 0%, rgba(60, 12, 18, 0.7) 100%);
  border: 1px solid rgba(200, 162, 74, 0.25);
  border-radius: var(--radius-lg);
}
.cart-empty-icon { font-size: 64px; margin-bottom: 16px; }
.cart-empty p { font-size: 16px; margin-bottom: 24px; color: var(--color-text-muted); }

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cart-line {
  display: grid;
  grid-template-columns: 120px 1fr auto auto;
  gap: 20px;
  align-items: center;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.85) 0%, rgba(60, 12, 18, 0.85) 100%);
  border: 2px solid rgba(200, 162, 74, 0.3);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: border-color 0.2s;
}
.cart-line:hover { border-color: var(--color-gold); }

.cart-line-media {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-cream);
  display: block;
}
.cart-line-media img { width: 100%; height: 100%; object-fit: cover; }
.cart-line-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 30%, rgba(200, 162, 74, 0.25) 0%, transparent 60%), linear-gradient(135deg, var(--color-cream) 0%, #ddc69a 100%);
  font-size: 56px;
}

.cart-line-name {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 22px;
  text-decoration: none;
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}
.cart-line-name:hover { text-decoration: underline; }
.cart-line-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 8px;
  line-height: 1.5;
}
.cart-line-unit {
  font-size: 13px;
  color: var(--color-text-muted);
}

.cart-line-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.cart-line-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px;
  transition: color 0.15s;
}
.cart-line-remove:hover { color: var(--color-gold); }

.cart-line-subtotal {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 22px;
  min-width: 100px;
  text-align: right;
}

.cart-clear {
  align-self: flex-end;
  background: none;
  border: 1px solid rgba(200, 162, 74, 0.3);
  color: var(--color-text-muted);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
  transition: border-color 0.15s, color 0.15s;
}
.cart-clear:hover { border-color: var(--color-gold); color: var(--color-gold); }

.cart-summary {
  position: sticky;
  top: 80px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}
.cart-summary h2 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 24px;
  margin-bottom: 16px;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(200, 162, 74, 0.3);
  padding-bottom: 12px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  font-size: 14.5px;
}
.summary-row.total {
  border-top: 1px solid rgba(200, 162, 74, 0.3);
  margin-top: 8px;
  padding-top: 16px;
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 26px;
}
.summary-free {
  color: var(--color-turquoise);
  font-weight: 600;
  font-size: 13px;
}
.summary-cta {
  width: 100%;
  margin-top: 20px;
  font-size: 14px;
}
.summary-cta:disabled { opacity: 0.5; cursor: not-allowed; }
.checkout-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(255, 80, 80, 0.12);
  border-left: 3px solid #ff8080;
  border-radius: 6px;
  font-size: 13px;
  color: #ffb3b3;
  text-align: left;
}
.summary-note {
  font-size: 12px;
  font-style: italic;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: 14px;
  line-height: 1.5;
}
.summary-back {
  display: block;
  text-align: center;
  margin-top: 14px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.15s;
}
.summary-back:hover { color: var(--color-gold); }

@media (max-width: 900px) {
  .cart-layout { grid-template-columns: 1fr; }
  .cart-summary { position: static; }
}
@media (max-width: 640px) {
  .cart-line {
    grid-template-columns: 80px 1fr;
    gap: 12px;
  }
  .cart-line-media { width: 80px; height: 80px; }
  .cart-line-controls,
  .cart-line-subtotal {
    grid-column: 1 / -1;
    text-align: left;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
