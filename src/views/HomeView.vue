<template>
  <div class="home">
    <SiteHeader />

    <!-- ============ HERO ============ -->
    <section class="hero">
      <div class="hero-scene" aria-hidden="true">
        <img src="/hero-banner.webp" alt="" class="hero-banner-img" />
      </div>
      <div class="hero-card">
        <h1 class="hero-title">ChatBordage !</h1>
        <p class="hero-desc">{{ $t('hero.description') }}</p>
        <RouterLink to="/preinscription" class="btn-primary">{{ $t('cta.buy') }}</RouterLink>
      </div>
      <div class="hero-deck" aria-hidden="true">
        <div class="card-mini card-mini-1">Carte</div>
        <div class="card-mini card-mini-2">Carte</div>
        <div class="card-mini card-mini-3">Carte</div>
      </div>
    </section>

    <!-- ============ EN BREF ============ -->
    <div class="section-banner">
      <h2>{{ $t('sections.inShort') }}</h2>
    </div>
    <section class="section-inshort">
      <div class="container inshort-grid">
        <div class="deck-stack" aria-hidden="true">
          <div class="card-mini">Carte</div>
          <div class="card-mini offset">Carte</div>
        </div>

        <div class="carousel">
          <div class="carousel-head">{{ currentSlide.title }}</div>
          <button class="carousel-arrow left" @click="prevSlide" aria-label="Précédent">‹</button>
          <div class="carousel-body">
            <img :src="currentSlide.image" :alt="currentSlide.title" class="carousel-image" />
          </div>
          <button class="carousel-arrow right" @click="nextSlide" aria-label="Suivant">›</button>
          <p class="carousel-caption">{{ currentSlide.description }}</p>
        </div>

        <div class="coin-stack" aria-hidden="true">
          <img src="/coin.png" alt="" class="coin coin-1" />
          <img src="/coin.png" alt="" class="coin coin-2" />
          <img src="/coin.png" alt="" class="coin coin-3" />
          <img src="/coin.png" alt="" class="coin coin-4" />
          <img src="/coin.png" alt="" class="coin coin-5" />
        </div>
      </div>
    </section>

    <!-- ============ LE CONCEPT ============ -->
    <div class="section-banner" id="concept">
      <h2>{{ $t('sections.concept') }}</h2>
    </div>
    <section class="section-concept">
      <div class="container concept-grid">
        <div class="concept-text">
          <p v-html="$t('concept.p1')"></p>
          <span class="bullet-divider">•</span>
          <p v-html="$t('concept.p2')"></p>
          <span class="bullet-divider">•</span>
          <p v-html="$t('concept.p3')"></p>
        </div>
        <div class="concept-card">
          <div class="carousel small">
            <div class="carousel-head">{{ $t('slides.gameType.title') }}</div>
            <div class="carousel-body">
              <img src="/chats/escobarre.png" alt="" class="carousel-image" />
            </div>
            <p class="carousel-caption">{{ $t('slides.gameType.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ QUEL CHAT PIRATE ============ -->
    <div class="section-banner">
      <h2>{{ $t('sections.whichCat') }}</h2>
    </div>
    <section class="section-ships">
      <div class="container">
        <div class="ship-carousel">
          <button class="carousel-arrow left" @click="prevShip" aria-label="Précédent">‹</button>
          <div class="ship-body">
            <img :src="currentShip.image" :alt="currentShip.name" class="ship-image" />
            <h3 class="ship-name">{{ currentShip.name }}</h3>
          </div>
          <button class="carousel-arrow right" @click="nextShip" aria-label="Suivant">›</button>
        </div>
        <p class="ships-caption" v-html="$t('catSlides.intro')"></p>
      </div>
    </section>

    <!-- ============ MÉCANIQUE IMPITOYABLE ============ -->
    <div class="section-banner">
      <h2>{{ $t('sections.mechanics') }}</h2>
    </div>
    <section class="section-mechanics">
      <div class="container">
        <div class="mech-row">
          <div class="mech-text">
            <h3>{{ $t('mechanics.resources.title') }}</h3>
            <p>{{ $t('mechanics.resources.text') }}</p>
          </div>
          <img src="/bateaux/Galion.webp" alt="" class="mech-image" />
        </div>
        <div class="mech-row reverse">
          <img src="/bateaux/Fregate.webp" alt="" class="mech-image" />
          <div class="mech-text">
            <h3>{{ $t('mechanics.attacks.title') }}</h3>
            <p>{{ $t('mechanics.attacks.text') }}</p>
          </div>
        </div>
        <div class="mech-row">
          <div class="mech-text">
            <h3>{{ $t('mechanics.noMercy.title') }}</h3>
            <p>{{ $t('mechanics.noMercy.text') }}</p>
          </div>
          <img src="/bateaux/Vaisseau_Fantôme.webp" alt="" class="mech-image" />
        </div>
      </div>
    </section>

    <!-- ============ SUPPORT NUMÉRIQUE ============ -->
    <div class="section-banner">
      <h2>{{ $t('sections.digital') }}</h2>
    </div>
    <section class="section-digital">
      <div class="container digital-grid">
        <div class="packshot placeholder-scene">
          <span class="placeholder-label">[ Packshot du jeu à intégrer ]</span>
        </div>
        <ul class="digital-bullets">
          <li v-html="$t('digital.app')"></li>
          <li v-html="$t('digital.events')"></li>
          <li v-html="$t('digital.shop')"></li>
        </ul>
      </div>
    </section>

    <!-- ============ CTA FINAL ============ -->
    <section class="section-cta">
      <div class="cta-coins-left" aria-hidden="true">
        <img src="/coin.png" alt="" />
        <img src="/coin.png" alt="" />
      </div>
      <div class="cta-center">
        <RouterLink to="/preinscription" class="btn-primary cta-buy">{{ $t('cta.buy') }}</RouterLink>
        <div class="stars" aria-label="5 sur 5">★ ★ ★ ★ ★</div>
        <p class="review">{{ $t('cta.review') }}</p>
      </div>
      <div class="cta-coins-right" aria-hidden="true">
        <img src="/coin.png" alt="" />
        <img src="/coin.png" alt="" />
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const { t } = useI18n()

const slides = computed(() => [
  { title: t('slides.gameType.title'), description: t('slides.gameType.description'), image: '/chats/escobarre.png' },
  { title: t('slides.duration.title'), description: t('slides.duration.description'), image: '/chats/harry.png' },
  { title: t('slides.mechanics.title'), description: t('slides.mechanics.description'), image: '/chats/pablo.png' }
])
const slideIdx = ref(0)
const currentSlide = computed(() => slides.value[slideIdx.value])
const nextSlide = () => { slideIdx.value = (slideIdx.value + 1) % slides.value.length }
const prevSlide = () => { slideIdx.value = (slideIdx.value - 1 + slides.value.length) % slides.value.length }

const ships = [
  { name: 'La Frégate', image: '/bateaux/Fregate.webp' },
  { name: 'Le Galion', image: '/bateaux/Galion.webp' },
  { name: 'La Corvette', image: '/bateaux/Corvette.webp' },
  { name: 'Le Vaisseau Fantôme', image: '/bateaux/Vaisseau_Fantôme.webp' },
  { name: 'La Caravelle', image: '/bateaux/Caravelle.webp' },
  { name: 'Le Sloop', image: '/bateaux/sloop.webp' },
  { name: 'Le Brick', image: '/bateaux/brick.webp' },
  { name: 'La Jonque', image: '/bateaux/jonque.webp' },
  { name: 'Le Trois-Mâts', image: '/bateaux/trois-mats.webp' },
  { name: 'La Felouque', image: '/bateaux/felouque.webp' },
  { name: 'Le Cotre', image: '/bateaux/cotre.webp' },
  { name: 'Le Brigantin', image: '/bateaux/brigantin.webp' },
  { name: 'Le Clipper', image: '/bateaux/clipper.webp' },
  { name: 'La Gabare', image: '/bateaux/gabare.webp' },
  { name: 'Le Cuirassé', image: '/bateaux/cuirasse.webp' }
]
const shipIdx = ref(0)
const currentShip = computed(() => ships[shipIdx.value])
const nextShip = () => { shipIdx.value = (shipIdx.value + 1) % ships.length }
const prevShip = () => { shipIdx.value = (shipIdx.value - 1 + ships.length) % ships.length }
</script>

<style scoped>
.home {
  background: var(--color-burgundy);
  color: var(--color-text-light);
}

/* ========= HERO ========= */
.hero {
  position: relative;
  min-height: clamp(360px, 50vw, 560px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: clamp(40px, 6vw, 80px) clamp(20px, 5vw, 64px);
  gap: 32px;
  overflow: hidden;
}
.hero-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.hero-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.hero-scene::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(107, 25, 34, 0.55) 0%, rgba(107, 25, 34, 0.15) 45%, rgba(107, 25, 34, 0) 70%);
  pointer-events: none;
}
.hero-card {
  position: relative;
  z-index: 1;
  background: linear-gradient(160deg, rgba(107, 25, 34, 0.96) 0%, rgba(79, 18, 25, 0.96) 100%);
  background-image:
    linear-gradient(160deg, rgba(107, 25, 34, 0.92) 0%, rgba(79, 18, 25, 0.96) 100%),
    url('/paper.png');
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 36px;
  max-width: 480px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(245, 233, 212, 0.08);
}
.hero-card::before {
  content: '';
  position: absolute;
  top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(200, 162, 74, 0.4);
  border-radius: calc(var(--radius-lg) - 4px);
  pointer-events: none;
}
.hero-title {
  font-size: clamp(44px, 6.5vw, 68px);
  color: var(--color-gold);
  margin-bottom: 18px;
  text-shadow: 0 3px 0 var(--color-burgundy-dark), 0 6px 14px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.04em;
}
.hero-desc {
  font-size: 15px;
  margin-bottom: 28px;
  color: var(--color-text-light);
  line-height: 1.65;
}
.hero-deck {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ========= CARDS MINI ========= */
.card-mini {
  width: 90px;
  height: 130px;
  background: linear-gradient(160deg, #5a5a5a 0%, #3d3d3d 100%);
  border: 2px solid #2a2a2a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.04em;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(245, 233, 212, 0.08);
  position: relative;
}
.card-mini::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(245, 233, 212, 0.15);
  border-radius: 5px;
  pointer-events: none;
}
.card-mini-1 { transform: rotate(-6deg); }
.card-mini-2 { transform: translateY(-8px); }
.card-mini-3 { transform: rotate(6deg); }

/* ========= PLACEHOLDERS ========= */
.placeholder-scene {
  background: repeating-linear-gradient(
    45deg,
    rgba(200, 162, 74, 0.12),
    rgba(200, 162, 74, 0.12) 12px,
    rgba(200, 162, 74, 0.06) 12px,
    rgba(200, 162, 74, 0.06) 24px
  );
  border: 2px dashed var(--color-gold);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}
.placeholder-label {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--color-gold);
  text-align: center;
  padding: 16px;
}

/* ========= EN BREF ========= */
.section-inshort {
  padding: var(--section-py) 0;
}
.inshort-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: clamp(20px, 4vw, 48px);
  align-items: center;
  justify-items: center;
}
.deck-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.deck-stack .card-mini.offset { transform: translateX(20px); }
.coin-stack {
  position: relative;
  width: 140px;
  height: 180px;
}
.coin {
  position: absolute;
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
}
.coin-1 { top: 0; left: 30px; transform: rotate(-8deg); }
.coin-2 { top: 30px; left: 0; transform: rotate(12deg); }
.coin-3 { top: 30px; left: 60px; transform: rotate(-4deg); }
.coin-4 { top: 70px; left: 30px; transform: rotate(6deg); }
.coin-5 { top: 100px; left: 50px; transform: rotate(-10deg); }

/* ========= CAROUSEL ========= */
.carousel {
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  background-image:
    linear-gradient(160deg, rgba(79, 18, 25, 0.94) 0%, rgba(60, 12, 18, 0.94) 100%),
    url('/paper.png');
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 22px 26px 26px;
  position: relative;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(245, 233, 212, 0.08);
}
.carousel-head {
  background: var(--color-cream);
  color: var(--color-burgundy);
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 0.06em;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.carousel-body {
  background: var(--color-cream);
  border-radius: var(--radius-md);
  padding: 12px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15);
}
.carousel-image {
  max-height: 180px;
  max-width: 100%;
  width: auto;
  object-fit: contain;
}
.carousel-caption {
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-light);
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.5;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  border: 2px solid var(--color-burgundy-dark);
  color: var(--color-burgundy-dark);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 2;
}
.carousel-arrow:hover {
  transform: translateY(-50%) scale(1.08);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.45);
}
.carousel-arrow:active { transform: translateY(-50%) scale(0.96); }
.carousel-arrow.left { left: -20px; }
.carousel-arrow.right { right: -20px; }

/* ========= CONCEPT ========= */
.section-concept {
  padding: var(--section-py) 0;
}
.concept-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}
.concept-text {
  text-align: center;
  font-size: 16px;
  line-height: 1.8;
}
.concept-text p {
  margin: 16px 0;
}
.bullet-divider {
  display: block;
  color: var(--color-gold);
  font-size: 20px;
  margin: 12px 0;
  letter-spacing: 8px;
  opacity: 0.7;
}
.concept-text :deep(strong) {
  color: var(--color-gold);
  font-weight: 600;
}

/* ========= SHIPS ========= */
.section-ships {
  padding: var(--section-py) 0;
}
.ship-carousel {
  position: relative;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  background-image:
    linear-gradient(160deg, rgba(79, 18, 25, 0.94) 0%, rgba(60, 12, 18, 0.94) 100%),
    url('/paper.png');
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 40px 48px;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(245, 233, 212, 0.08);
}
.ship-carousel::before {
  content: '';
  position: absolute;
  top: 10px; left: 10px; right: 10px; bottom: 10px;
  border: 1px solid rgba(200, 162, 74, 0.35);
  border-radius: calc(var(--radius-lg) - 4px);
  pointer-events: none;
}
.ship-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 280px;
  justify-content: center;
}
.ship-image {
  max-height: 220px;
  max-width: 100%;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.4));
}
.ship-name {
  font-size: 32px;
  color: var(--color-gold);
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.ships-caption {
  text-align: center;
  margin-top: 24px;
  font-size: 15px;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.ships-caption :deep(u) {
  color: var(--color-gold);
  text-decoration: none;
  font-weight: 600;
}

/* ========= MECHANICS ========= */
.section-mechanics {
  padding: var(--section-py) 0;
}
.mech-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  margin-bottom: 56px;
}
.mech-row.reverse { direction: rtl; }
.mech-row.reverse > * { direction: ltr; }
.mech-text h3 {
  color: var(--color-gold);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  margin-bottom: 12px;
  letter-spacing: 0.04em;
}
.mech-text p { font-size: 15px; line-height: 1.7; }
.mech-image {
  max-width: 280px;
  margin: 0 auto;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.4));
  transition: transform 0.4s ease;
}
.mech-image:hover {
  transform: translateY(-6px) rotate(-1deg);
}

/* ========= DIGITAL ========= */
.section-digital {
  padding: var(--section-py) 0;
}
.digital-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}
.packshot {
  min-height: 320px;
}
.digital-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
}
.digital-bullets li {
  position: relative;
  padding-left: 32px;
  margin-bottom: 24px;
  font-size: 15px;
  line-height: 1.7;
}
.digital-bullets li::before {
  content: '⚓';
  position: absolute;
  left: 0;
  top: 2px;
  color: var(--color-gold);
  font-size: 18px;
  line-height: 1;
}

/* ========= CTA ========= */
.section-cta {
  padding: var(--section-py) 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: nowrap;
}
.cta-coins-left, .cta-coins-right {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.cta-coins-left img, .cta-coins-right img {
  width: 48px;
  height: 48px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
}
.cta-coins-left img:nth-child(1) { transform: rotate(-12deg) translateY(8px); }
.cta-coins-left img:nth-child(2) { transform: rotate(6deg); }
.cta-coins-right img:nth-child(1) { transform: rotate(-6deg); }
.cta-coins-right img:nth-child(2) { transform: rotate(12deg) translateY(8px); }
.cta-center { text-align: center; }
.cta-buy { font-size: 18px; padding: 16px 44px; }
.stars {
  color: var(--color-gold);
  font-size: 22px;
  letter-spacing: 4px;
  margin-top: 18px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}
.review {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-top: 4px;
}

/* ========= RESPONSIVE ========= */
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    min-height: clamp(420px, 90vw, 560px);
  }
  .hero-deck { justify-content: center; }
  .hero-card { margin: 0 auto; }
  .inshort-grid { grid-template-columns: 1fr; }
  .deck-stack, .coin-stack { display: none; }
  .concept-grid,
  .mech-row,
  .mech-row.reverse,
  .digital-grid {
    grid-template-columns: 1fr;
    direction: ltr;
  }
  /* CTA section mobile : pièces plus petites en ligne, pas wrappées */
  .section-cta {
    gap: 16px;
    padding: clamp(40px, 12vw, 60px) 16px;
  }
  .cta-coins-left img, .cta-coins-right img {
    width: 36px;
    height: 36px;
  }
  .cta-buy { font-size: 16px; padding: 14px 28px; }
}

@media (max-width: 480px) {
  .section-cta {
    flex-direction: column;
    gap: 24px;
  }
  .cta-coins-left, .cta-coins-right {
    order: 2;
  }
  .cta-center { order: 1; }
}
</style>
