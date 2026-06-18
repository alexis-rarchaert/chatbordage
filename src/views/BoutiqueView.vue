<template>
  <div class="shop-page">
    <SiteHeader />

    <div class="shop-banner">
      <img src="/hero-banner.webp" alt="" class="shop-banner-img" />
      <h1 class="shop-banner-title">{{ $t('header.shop') }}</h1>
    </div>

    <main class="shop-main container">
      <p class="shop-intro" v-reveal>
        {{ $t('shop.intro') }}
      </p>

      <div class="shop-grid">
        <article
          v-for="(item, idx) in products"
          :key="item.id"
          class="product-card"
          v-reveal="'zoom'"
          :style="{ transitionDelay: `${idx * 80}ms` }"
        >
          <RouterLink :to="`/boutique/${item.slug}`" class="product-link">
            <span v-if="item.badge" class="product-badge">{{ $t('products.' + item.id + '.badge') }}</span>

            <div class="product-media">
              <img v-if="item.image" :src="item.image" :alt="$t('products.' + item.id + '.name')" class="product-img" />
              <div v-else class="product-placeholder" aria-hidden="true">
                <span class="product-placeholder-icon">{{ item.icon }}</span>
              </div>
            </div>

            <div class="product-body">
              <h3 class="product-name">{{ $t('products.' + item.id + '.name') }}</h3>
              <p class="product-desc">{{ $t('products.' + item.id + '.shortDesc') }}</p>
              <div class="product-price">{{ formatPrice(item.price) }}</div>
            </div>
          </RouterLink>

          <div class="product-foot">
            <template v-if="cart.getQuantity(item.id) === 0">
              <button class="btn-primary product-btn" @click="cart.add(item.id)">
                {{ $t('shop.addToCart') }}
              </button>
            </template>
            <template v-else>
              <QuantitySelector
                :model-value="cart.getQuantity(item.id)"
                :min="0"
                :max="99"
                @update:model-value="v => cart.setQuantity(item.id, v)"
              />
              <span class="product-incart">{{ cart.getQuantity(item.id) }} {{ $t('shop.inCart') }}</span>
            </template>
          </div>
        </article>
      </div>

      <p class="shop-note">
        {{ $t('shop.shippingNote') }}
        <RouterLink to="/preinscription" class="shop-link">{{ $t('shop.preorderLink') }}</RouterLink>
        {{ $t('shop.preorderNoteEnd') }}
      </p>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import { products, formatPrice } from '../lib/products'
import { useCart } from '../lib/cart'

const cart = useCart()
</script>

<style scoped>
.shop-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shop-banner {
  position: relative;
  min-height: clamp(180px, 26vw, 280px);
  border-bottom: 3px solid var(--color-gold);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shop-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shop-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(107, 25, 34, 0.4) 100%);
}
.shop-banner-title {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(48px, 8vw, 80px);
  text-shadow: 0 3px 0 var(--color-burgundy-dark), 0 6px 16px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
}

.shop-main { padding: clamp(40px, 6vw, 64px) 20px; flex: 1; }
.shop-intro {
  text-align: center;
  font-size: clamp(16px, 1.6vw, 18px);
  max-width: 640px;
  margin: 0 auto clamp(32px, 4vw, 48px);
  line-height: 1.7;
  font-style: italic;
  color: var(--color-text-muted);
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
}
.product-card {
  position: relative;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  background-image:
    linear-gradient(160deg, rgba(79, 18, 25, 0.94) 0%, rgba(60, 12, 18, 0.94) 100%),
    url('/paper.png');
  background-size: 100% 100%, cover;
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.5);
}
.product-link {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
  color: inherit;
}
.product-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  color: var(--color-burgundy-dark);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 999px;
  border: 2px solid var(--color-burgundy-dark);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.35);
}

.product-media {
  position: relative;
  height: 220px;
  background: var(--color-cream);
  border-bottom: 2px solid var(--color-gold-dark);
  overflow: hidden;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.product-card:hover .product-img { transform: scale(1.04); }

.product-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 30%, rgba(200, 162, 74, 0.2) 0%, transparent 60%),
    linear-gradient(135deg, var(--color-cream) 0%, #ddc69a 100%);
}
.product-placeholder-icon {
  font-size: 90px;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
}

.product-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-name {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 24px;
  margin-bottom: 8px;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.product-desc {
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text-light);
  margin-bottom: 14px;
  flex: 1;
}
.product-price {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-gold);
  line-height: 1;
}

.product-foot {
  padding: 16px 22px 22px;
  border-top: 1px solid rgba(200, 162, 74, 0.25);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.product-btn {
  width: 100%;
  font-size: 13px;
  padding: 10px 14px;
}
.product-incart {
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

.shop-note {
  text-align: center;
  margin-top: clamp(40px, 5vw, 56px);
  font-size: 14px;
  color: var(--color-text-muted);
  font-style: italic;
}
.shop-link {
  color: var(--color-gold);
  font-weight: 600;
  text-decoration: underline;
}
</style>
