<template>
  <div class="shop-page">
    <SiteHeader />

    <div class="shop-banner">
      <img src="/hero-banner.webp" alt="" class="shop-banner-img" />
      <h1 class="shop-banner-title">Boutique</h1>
    </div>

    <main class="shop-main container">
      <p class="shop-intro" v-reveal>
        Embarquez l'aventure chez vous : le jeu, et quelques babioles dignes des plus fins corsaires.
      </p>

      <div class="shop-grid">
        <article
          v-for="(item, idx) in items"
          :key="item.id"
          class="product-card"
          v-reveal="'zoom'"
          :style="{ transitionDelay: `${idx * 100}ms` }"
        >
          <span v-if="item.badge" class="product-badge">{{ item.badge }}</span>

          <div class="product-media">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="product-img" />
            <div v-else class="product-placeholder" aria-hidden="true">
              <span class="product-placeholder-icon">{{ item.icon }}</span>
            </div>
          </div>

          <div class="product-body">
            <h3 class="product-name">{{ item.name }}</h3>
            <p class="product-desc">{{ item.desc }}</p>

            <ul v-if="item.features" class="product-features">
              <li v-for="f in item.features" :key="f">{{ f }}</li>
            </ul>

            <div class="product-foot">
              <div class="product-price">{{ item.price }}<span class="currency">€</span></div>
              <button
                class="btn-primary product-btn"
                :class="{ added: addedId === item.id }"
                @click="addToCart(item.id)"
              >
                {{ addedId === item.id ? 'Ajouté ✓' : 'Ajouter au panier' }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <p class="shop-note">
        Les commandes seront expédiées dès la sortie officielle du jeu.
        <RouterLink to="/preinscription" class="shop-link">Préinscris-toi</RouterLink>
        pour être prévenu en premier.
      </p>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

type Product = {
  id: string
  name: string
  desc: string
  price: number
  image?: string
  icon?: string
  badge?: string
  features?: string[]
}

const items: Product[] = [
  {
    id: 'jeu',
    name: 'ChatBordage — Le jeu',
    desc: 'Le jeu de cartes à rôles cachés dans un univers de chats pirates. 4 à 6 joueurs, ~30 minutes de pure trahison féline.',
    price: 34.9,
    image: '/packshot.webp',
    badge: 'Nouveauté',
    features: [
      '100 cartes à jouer',
      'Application compagnon (15 navires + 5 rôles)',
      'Des pièces façon doublons',
      '7 à 77 ans'
    ]
  },
  {
    id: 'stickers',
    name: 'Pack de 5 stickers',
    desc: 'Les 5 chats pirates en stickers vinyle waterproof. Décore ta gamelle, ton ordi, ton tonneau de rhum.',
    price: 7.5,
    icon: '🐾',
    features: [
      'Vinyle découpé waterproof',
      'Chat-rles Henri, Miranda, Kim, Sylas, Maskey',
      'Format ~7 cm'
    ]
  },
  {
    id: 'mug',
    name: 'Mug Capitaine',
    desc: 'Un mug 33cl à l\'effigie de Chat-rles Henri. Idéal pour siroter ton café avant de couler tes amis.',
    price: 14.9,
    icon: '☕',
    features: [
      'Céramique 33 cl',
      'Passe au lave-vaisselle',
      'Impression haute définition'
    ]
  }
]

const addedId = ref<string | null>(null)
function addToCart(id: string) {
  addedId.value = id
  setTimeout(() => {
    if (addedId.value === id) addedId.value = null
  }, 1500)
}
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

.shop-main {
  padding: clamp(40px, 6vw, 64px) 20px;
  flex: 1;
}
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.5);
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
  height: 260px;
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
  font-size: 110px;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
}

.product-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-name {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 26px;
  margin-bottom: 10px;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.product-desc {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--color-text-light);
  margin-bottom: 16px;
}
.product-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-muted);
}
.product-features li {
  position: relative;
  padding-left: 18px;
}
.product-features li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: var(--color-gold);
  font-size: 11px;
  top: 3px;
}
.product-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(200, 162, 74, 0.25);
}
.product-price {
  font-family: var(--font-display);
  font-size: 32px;
  color: var(--color-gold);
  line-height: 1;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.product-price .currency {
  font-size: 0.6em;
  margin-left: 2px;
}
.product-btn {
  font-size: 13px;
  padding: 10px 18px;
  white-space: nowrap;
}
.product-btn.added {
  background: linear-gradient(180deg, var(--color-turquoise) 0%, #2d8a90 100%);
  color: var(--color-cream);
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

@media (max-width: 640px) {
  .product-media { height: 220px; }
  .product-foot {
    flex-direction: column;
    align-items: stretch;
  }
  .product-btn { width: 100%; }
}
</style>
