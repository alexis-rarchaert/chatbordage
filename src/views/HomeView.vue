<template>
  <div class="home">
    <!-- ============ HEADER ============ -->
    <header class="site-header">
      <div class="header-inner">
        <div class="logo-wrap">
          <img src="/favicon.png" alt="ChatBordage" class="logo-img" />
          <span class="logo-text">ChatBordage</span>
        </div>
        <button class="burger" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <nav class="nav-links" :class="{ open: menuOpen }">
          <RouterLink to="/">{{ $t('header.home') }}</RouterLink>
          <a href="#concept">{{ $t('header.theGame') }}</a>
          <RouterLink to="/reglement">{{ $t('header.rules') }}</RouterLink>
          <RouterLink to="/preinscription" class="nav-cta">{{ $t('hero.preorder') }}</RouterLink>
          <select v-model="$i18n.locale" class="lang-selector" aria-label="Langue">
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </nav>
      </div>
    </header>

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

    <!-- ============ FOOTER ============ -->
    <footer class="site-footer">
      <div class="socials" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <a href="#" aria-disabled="true">{{ $t('footer.legal') }}</a>
      <a href="#" aria-disabled="true">{{ $t('footer.tos') }}</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const menuOpen = ref(false)

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

/* ========= HEADER ========= */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-burgundy-dark);
  border-bottom: 2px solid var(--color-gold);
}
.header-inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-img { width: 44px; height: 44px; }
.logo-text {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-cream);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-links a {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.15s;
}
.nav-links a:hover { color: var(--color-gold); }
.nav-cta {
  background: var(--color-gold);
  color: var(--color-burgundy) !important;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-weight: 700;
}
.lang-selector {
  background: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-gold);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
}
.burger {
  display: none;
  background: var(--color-burgundy);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 10px;
}
.burger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-cream);
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
  background: var(--color-burgundy);
  border: 2px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 460px;
  box-shadow: var(--shadow-card);
}
.hero-title {
  font-size: clamp(40px, 6vw, 64px);
  color: var(--color-cream);
  margin-bottom: 16px;
}
.hero-desc {
  font-size: 15px;
  margin-bottom: 24px;
  color: var(--color-text-light);
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
  background: #888;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-card);
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
}
.coin-1 { top: 0; left: 30px; }
.coin-2 { top: 30px; left: 0; }
.coin-3 { top: 30px; left: 60px; }
.coin-4 { top: 70px; left: 30px; }
.coin-5 { top: 100px; left: 50px; }

/* ========= CAROUSEL ========= */
.carousel {
  background: var(--color-burgundy-dark);
  border: 2px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 20px;
  position: relative;
  max-width: 420px;
  width: 100%;
  text-align: center;
}
.carousel-head {
  background: var(--color-cream);
  color: var(--color-burgundy);
  font-family: var(--font-display);
  font-size: 22px;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.carousel-body {
  background: var(--color-cream);
  border-radius: var(--radius-md);
  padding: 16px;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.carousel-image {
  max-height: 180px;
  width: auto;
}
.carousel-caption {
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-light);
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-gold);
  border: none;
  color: var(--color-burgundy);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: background 0.15s;
}
.carousel-arrow:hover { background: var(--color-gold-dark); }
.carousel-arrow.left { left: -18px; }
.carousel-arrow.right { right: -18px; }

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
  font-size: 18px;
  margin: 8px 0;
}

/* ========= SHIPS ========= */
.section-ships {
  padding: var(--section-py) 0;
}
.ship-carousel {
  position: relative;
  background: var(--color-burgundy-dark);
  border: 2px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}
.ship-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.ship-image {
  max-height: 220px;
  width: auto;
}
.ship-name {
  font-size: 28px;
  color: var(--color-gold);
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
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.mech-text p { font-size: 15px; line-height: 1.7; }
.mech-image {
  max-width: 280px;
  margin: 0 auto;
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
  padding-left: 24px;
  margin-bottom: 20px;
  font-size: 15px;
  line-height: 1.7;
}
.digital-bullets li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-gold);
  font-size: 24px;
  line-height: 1;
}

/* ========= CTA ========= */
.section-cta {
  padding: var(--section-py) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}
.cta-coins-left, .cta-coins-right {
  display: flex;
  gap: 8px;
}
.cta-coins-left img, .cta-coins-right img { width: 48px; height: 48px; }
.cta-center { text-align: center; }
.cta-buy { font-size: 18px; padding: 16px 40px; }
.stars {
  color: var(--color-gold);
  font-size: 20px;
  letter-spacing: 4px;
  margin-top: 16px;
}
.review {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-top: 4px;
}

/* ========= FOOTER ========= */
.site-footer {
  background: var(--color-gold-dark);
  color: var(--color-burgundy);
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.site-footer a {
  color: var(--color-burgundy);
  text-decoration: underline;
  font-size: 14px;
}
.socials {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-burgundy);
}

/* ========= RESPONSIVE ========= */
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
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
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-burgundy-dark);
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    border-bottom: 2px solid var(--color-gold);
  }
  .nav-links.open { display: flex; }
  .burger { display: flex; }
  .site-header { position: relative; }
}
</style>
