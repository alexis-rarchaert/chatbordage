<template>
  <div class="chatbordage-wrapper">
    <!-- En-tête -->
    <header class="header">
      <RouterLink to="/" class="logo-box">ChatBordage</RouterLink>

      <div class="menu-icon">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>

      <nav class="nav-links">
        <RouterLink to="/">{{ $t('header.home') }}</RouterLink>
        <a href="#concept">{{ $t('header.theGame') }}</a>
        <RouterLink to="/reglement">{{ $t('header.rules') }}</RouterLink>
        <select v-model="$i18n.locale" class="lang-selector">
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </nav>
    </header>

    <!-- Section Hero -->
    <main class="main-content" id="hero">
      <section class="text-section">
        <h1 class="title">{{ $t('hero.title') }}</h1>
        <p class="description">
          {{ $t('hero.description') }}
        </p>
        <button class="buy-button">{{ $t('hero.preorder') }}</button>
      </section>

      <section class="visual-section">
        <div class="cards-container">
          <div class="card left-card">
            <div class="card-content">
              <div class="card-top bg-red">{{ $t('cards.mage') }}</div>
              <div class="card-bottom"></div>
            </div>
          </div>
          <div class="card center-card">
            <div class="card-content">
              <div class="card-top bg-navy">{{ $t('cards.nekomancer') }}</div>
              <div class="card-bottom"></div>
            </div>
          </div>
          <div class="card right-card">
            <div class="card-content">
              <div class="card-top bg-teal">{{ $t('cards.captain') }}</div>
              <div class="card-bottom"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Section En Bref -->
    <section class="en-bref-section" id="en-bref">
      <div class="banner-en-bref">
        <h2>{{ $t('sections.inShort') }}</h2>
      </div>

      <div class="carousel-container">
        <button class="arrow-btn" @click="prevSlide">❮</button>

        <div class="carousel-content">
          <h3 class="carousel-title">{{ $t(slides[currentIndex].title) }}</h3>
          <div class="carousel-illustration">
            {{ slides[currentIndex].imageLabel }}
          </div>
          <p class="carousel-description">
            {{ $t(slides[currentIndex].description) }}
          </p>
        </div>

        <button class="arrow-btn" @click="nextSlide">❯</button>
      </div>
    </section>

    <!-- Section Le Concept -->
    <section class="concept-section" id="concept">
      <div class="banner-concept">
        <h2>{{ $t('sections.concept') }}</h2>
      </div>

      <div class="concept-content">
        <p v-html="$t('concept.p1')"></p>
        <span class="concept-dot"></span>
        <p v-html="$t('concept.p2')"></p>
        <span class="concept-dot"></span>
        <p v-html="$t('concept.p3')"></p>
      </div>
    </section>

    <!-- Section : QUEL CHAT PIRATE SEREZ-VOUS ? -->
    <section class="ships-section">
      <div class="carousel-container-ships">
        <!-- Flèche Gauche -->
        <button class="arrow-btn" @click="prevCatSlide">❮</button>

        <!-- Contenu de la carte -->
        <div class="carousel-content">
          <h2 class="carousel-title-ships">{{ $t('sections.whichCat') }}</h2>
          
          <div class="carousel-illustration-ships">
            {{ catSlides[catCurrentIndex].imageLabel }}
          </div>
          
          <p class="carousel-description-ships" v-html="$t(catSlides[catCurrentIndex].description)"></p>
        </div>

        <!-- Flèche Droite -->
        <button class="arrow-btn" @click="nextCatSlide">❯</button>
      </div>
    </section>

    <!-- Section : UNE MÉCANIQUE IMPITOYABLE -->
    <section class="mechanics-section">
      <div class="banner-mechanics">
        <h2>{{ $t('sections.mechanics') }}</h2>
      </div>

      <div class="mechanics-container">
        
        <div class="mechanic-row">
          <div class="mechanic-text">
            <p><strong>{{ $t('mechanics.resources.title') }}</strong><br>
            {{ $t('mechanics.resources.text') }}</p>
          </div>
          <div class="mechanic-illustration bg-teal">
            Illustration
          </div>
        </div>

        <div class="mechanic-row reverse">
          <div class="mechanic-text">
            <p><strong>{{ $t('mechanics.attacks.title') }}</strong><br>
            {{ $t('mechanics.attacks.text') }}</p>
          </div>
          <div class="mechanic-illustration bg-red">
            Illustration
          </div>
        </div>

        <div class="mechanic-row">
          <div class="mechanic-text">
            <p><strong>{{ $t('mechanics.noMercy.title') }}</strong><br>
            {{ $t('mechanics.noMercy.text') }}</p>
          </div>
          <div class="mechanic-illustration bg-navy">
            Illustration
          </div>
        </div>

      </div>
    </section>

    <!-- Section : LE SUPPORT NUMÉRIQUE -->
    <section class="digital-section">
      <div class="banner-digital">
        <h2>{{ $t('sections.digital') }}</h2>
      </div>

      <div class="digital-container">
        <div class="digital-photo">
          Photo
        </div>

        <ul class="digital-list">
          <li v-html="$t('digital.app')"></li>
          <li v-html="$t('digital.events')"></li>
          <li v-html="$t('digital.shop')"></li>
        </ul>
      </div>
    </section>

    <!-- Section : CALL TO ACTION FINAL -->
    <section class="final-cta-section">
      <button class="buy-button final-button">{{ $t('cta.buy') }}</button>
      
      <div class="stars-container">
        ★★★★★
      </div>
      
      <p class="review-text">{{ $t('cta.review') }}</p>
    </section>

    <!-- ========================================================
         NOUVELLE SECTION : FOOTER
         ======================================================== -->
    <footer class="footer-section">
      <!-- Les 3 cercles pour les réseaux sociaux -->
      <div class="social-icons">
        <a href="#" class="social-circle" aria-label="Réseau social 1"></a>
        <a href="#" class="social-circle" aria-label="Réseau social 2"></a>
        <a href="#" class="social-circle" aria-label="Réseau social 3"></a>
      </div>

      <!-- Liens légaux -->
      <div class="footer-links">
        <a href="#">{{ $t('footer.legal') }}</a>
        <a href="#">{{ $t('footer.tos') }}</a>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue';

// --- LOGIQUE DU CARROUSEL 1 (EN BREF) ---
const slides = ref([
  {
    title: 'slides.gameType.title',
    imageLabel: 'Illustration',
    description: 'slides.gameType.description'
  },
  {
    title: 'slides.duration.title',
    imageLabel: 'Illustration',
    description: 'slides.duration.description'
  },
  {
    title: 'slides.mechanics.title',
    imageLabel: 'Illustration',
    description: 'slides.mechanics.description'
  }
]);

const currentIndex = ref(0);
const nextSlide = () => { currentIndex.value = (currentIndex.value + 1) % slides.value.length; };
const prevSlide = () => { currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length; };

// --- LOGIQUE DU CARROUSEL 2 (CHATS PIRATES / NAVIRES) ---
const catSlides = ref([
  {
    imageLabel: 'Illustration',
    description: 'catSlides.intro'
  },
  {
    imageLabel: 'La Frégate',
    description: 'catSlides.frigate'
  },
  {
    imageLabel: 'La Jonque',
    description: 'catSlides.junk'
  },
  {
    imageLabel: 'Vaisseau Fantôme',
    description: 'catSlides.ghostShip'
  }
]);

const catCurrentIndex = ref(0);
const nextCatSlide = () => { catCurrentIndex.value = (catCurrentIndex.value + 1) % catSlides.value.length; };
const prevCatSlide = () => { catCurrentIndex.value = (catCurrentIndex.value - 1 + catSlides.value.length) % catSlides.value.length; };
</script>

<style src="./HomeView.css" scoped></style>