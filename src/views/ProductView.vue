<template>
  <div class="pp-page">
    <SiteHeader />

    <div v-if="!product" class="pp-empty container">
      <h1>{{ $t('product.notFound') }}</h1>
      <p>{{ $t('product.notFoundDesc') }}</p>
      <RouterLink to="/boutique" class="btn-primary">{{ $t('product.backToShop') }}</RouterLink>
    </div>

    <main v-else class="pp-main container">
      <nav class="pp-breadcrumb">
        <RouterLink to="/">{{ $t('header.home') }}</RouterLink>
        <span class="sep">›</span>
        <RouterLink to="/boutique">{{ $t('header.shop') }}</RouterLink>
        <span class="sep">›</span>
        <span class="current">{{ $t('products.' + product.id + '.name') }}</span>
      </nav>

      <div class="pp-layout">
        <div class="pp-media" v-reveal="'left'">
          <span v-if="product.badge" class="pp-badge">{{ $t('products.' + product.id + '.badge') }}</span>
          <img v-if="product.image" :src="product.image" :alt="$t('products.' + product.id + '.name')" class="pp-img" />
          <div v-else class="pp-placeholder" aria-hidden="true">
            <span>{{ product.icon }}</span>
          </div>
        </div>

        <div class="pp-info" v-reveal="'right'">
          <h1 class="pp-title">{{ $t('products.' + product.id + '.name') }}</h1>
          <p class="pp-short">{{ $t('products.' + product.id + '.shortDesc') }}</p>

          <div class="pp-price">
            <span class="amount">{{ formatPrice(product.price) }}</span>
            <span class="pp-stock" v-if="product.stock != null">
              <span class="dot" :class="{ low: product.stock < 50 }"></span>
              {{ product.stock > 0 ? $t('product.inStock') : $t('product.outOfStock') }}
            </span>
          </div>

          <div class="pp-actions">
            <QuantitySelector v-model="qty" :min="1" :max="99" />
            <button class="btn-primary pp-add" @click="onAdd">
              <span v-if="!justAdded">{{ $t('shop.addToCart') }}</span>
              <span v-else>{{ $t('product.addedToCart', { count: inCart }) }}</span>
            </button>
          </div>

          <div v-if="product.features?.length" class="pp-features">
            <h3>{{ $t('product.includes') }}</h3>
            <ul>
              <li v-for="(f, idx) in product.features" :key="f">{{ $t('products.' + product.id + '.features.' + idx) }}</li>
            </ul>
          </div>
        </div>
      </div>

      <section class="pp-desc">
        <h2>{{ $t('product.description') }}</h2>
        <p v-for="idx in product.longDesc.length" :key="idx">{{ $t('products.' + product.id + '.longDesc.' + (idx - 1)) }}</p>
      </section>

      <section v-if="related.length" class="pp-related">
        <h2>{{ $t('product.related') }}</h2>
        <div class="pp-related-grid">
          <RouterLink
            v-for="r in related"
            :key="r.id"
            :to="`/boutique/${r.slug}`"
            class="pp-related-card"
          >
            <div class="pp-related-media">
              <img v-if="r.image" :src="r.image" :alt="$t('products.' + r.id + '.name')" />
              <span v-else class="pp-related-icon">{{ r.icon }}</span>
            </div>
            <div class="pp-related-body">
              <h3>{{ $t('products.' + r.id + '.name') }}</h3>
              <span class="pp-related-price">{{ formatPrice(r.price) }}</span>
            </div>
          </RouterLink>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import { findProduct, products, formatPrice } from '../lib/products'
import { useCart } from '../lib/cart'

const route = useRoute()
const cart = useCart()

const product = computed(() => findProduct(String(route.params.id ?? '')))
const qty = ref(1)
const justAdded = ref(false)
const inCart = computed(() => product.value ? cart.getQuantity(product.value.id) : 0)
const related = computed(() => product.value
  ? products.filter(p => p.id !== product.value!.id).slice(0, 3)
  : []
)

watch(() => route.params.id, () => {
  qty.value = 1
  justAdded.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

function onAdd() {
  if (!product.value) return
  cart.add(product.value.id, qty.value)
  justAdded.value = true
  setTimeout(() => { justAdded.value = false }, 2200)
}
</script>

<style scoped>
.pp-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.pp-empty {
  text-align: center;
  padding: 80px 20px;
  flex: 1;
}
.pp-empty h1 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 36px;
  margin-bottom: 12px;
}
.pp-empty p { margin-bottom: 24px; }

.pp-main { padding: 32px 20px 64px; flex: 1; }

.pp-breadcrumb {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pp-breadcrumb a {
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.pp-breadcrumb a:hover { color: var(--color-gold); }
.pp-breadcrumb .sep { opacity: 0.5; }
.pp-breadcrumb .current { color: var(--color-gold); }

.pp-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
  margin-bottom: 56px;
}

.pp-media {
  position: relative;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-cream);
  aspect-ratio: 4 / 3;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}
.pp-img { width: 100%; height: 100%; object-fit: cover; }
.pp-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 30% 30%, rgba(200, 162, 74, 0.25) 0%, transparent 60%), linear-gradient(135deg, var(--color-cream) 0%, #ddc69a 100%);
  font-size: 140px;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25));
}
.pp-badge {
  position: absolute;
  top: 16px; left: 16px;
  z-index: 2;
  background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  color: var(--color-burgundy-dark);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 999px;
  border: 2px solid var(--color-burgundy-dark);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.35);
}

.pp-title {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(32px, 4vw, 44px);
  letter-spacing: 0.03em;
  margin-bottom: 12px;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.pp-short {
  font-size: 16px;
  line-height: 1.65;
  color: var(--color-text-light);
  margin-bottom: 24px;
}
.pp-price {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(200, 162, 74, 0.25);
}
.pp-price .amount {
  font-family: var(--font-display);
  font-size: 40px;
  color: var(--color-gold);
  line-height: 1;
}
.pp-stock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}
.pp-stock .dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--color-turquoise);
  box-shadow: 0 0 8px rgba(58, 170, 176, 0.6);
}
.pp-stock .dot.low { background: #e0a14a; box-shadow: 0 0 8px rgba(224, 161, 74, 0.6); }

.pp-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.pp-add { flex: 1; min-width: 220px; font-size: 14px; }

.pp-features h3 {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--color-gold);
  margin-bottom: 10px;
}
.pp-features ul { list-style: none; padding: 0; margin: 0; }
.pp-features li {
  position: relative;
  padding-left: 22px;
  font-size: 14.5px;
  line-height: 1.7;
}
.pp-features li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: var(--color-gold);
  top: 4px;
  font-size: 11px;
}

.pp-desc, .pp-related {
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.7) 0%, rgba(60, 12, 18, 0.7) 100%);
  border: 1px solid rgba(200, 162, 74, 0.25);
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 28px;
}
.pp-desc h2, .pp-related h2 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 28px;
  margin-bottom: 16px;
  letter-spacing: 0.03em;
}
.pp-desc p { margin: 0 0 14px; line-height: 1.75; font-size: 15px; }

.pp-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.pp-related-card {
  display: flex;
  flex-direction: column;
  background: rgba(60, 12, 18, 0.6);
  border: 2px solid rgba(200, 162, 74, 0.3);
  border-radius: var(--radius-md);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s;
}
.pp-related-card:hover {
  border-color: var(--color-gold);
  transform: translateY(-4px);
}
.pp-related-media {
  height: 140px;
  background: var(--color-cream);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pp-related-media img { width: 100%; height: 100%; object-fit: cover; }
.pp-related-icon {
  font-size: 60px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
}
.pp-related-body { padding: 14px 16px; }
.pp-related-body h3 {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--color-gold);
  margin-bottom: 6px;
}
.pp-related-price {
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 820px) {
  .pp-layout { grid-template-columns: 1fr; gap: 28px; }
}
</style>
