<template>
  <div class="legal-page">
    <SiteHeader />

    <div class="legal-banner">
      <img src="/hero-banner.webp" alt="" class="legal-banner-img" />
      <h1 class="legal-banner-title">{{ $t('legalPage.title') }}</h1>
    </div>

    <main class="legal-main container">
      <div class="legal-content">
        <section class="legal-section" v-reveal>
          <h2>{{ $t('legalPage.sections.editor.title') }}</h2>
          <p>{{ $t('legalPage.sections.editor.content') }}</p>
        </section>

        <section class="legal-section" v-reveal>
          <h2>{{ $t('legalPage.sections.hosting.title') }}</h2>
          <p v-html="$t('legalPage.sections.hosting.content')"></p>
        </section>

        <section class="legal-section" v-reveal>
          <h2>{{ $t('legalPage.sections.intellectualProperty.title') }}</h2>
          <p>{{ $t('legalPage.sections.intellectualProperty.content') }}</p>
        </section>

        <section class="legal-section" v-reveal>
          <h2>{{ $t('legalPage.sections.privacy.title') }}</h2>
          <p>{{ $t('legalPage.sections.privacy.content') }}</p>
        </section>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<style scoped>
.legal-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.legal-banner {
  position: relative;
  min-height: clamp(180px, 26vw, 280px);
  border-bottom: 3px solid var(--color-gold);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legal-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.legal-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(107, 25, 34, 0.4) 100%);
}

.legal-banner-title {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(40px, 6vw, 64px);
  text-shadow: 0 3px 0 var(--color-burgundy-dark), 0 6px 16px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
  text-align: center;
  padding: 0 20px;
}

.legal-main {
  flex: 1;
  padding: 48px 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.legal-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.legal-section {
  padding: 28px 32px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.7) 0%, rgba(60, 12, 18, 0.7) 100%);
  border: 1px solid rgba(200, 162, 74, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.legal-section h2 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 28px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(200, 162, 74, 0.2);
  padding-bottom: 8px;
}

.legal-section p {
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-light);
}

.legal-section a {
  color: var(--color-gold);
  text-decoration: underline;
  transition: color 0.15s;
}

.legal-section a:hover {
  color: var(--color-cream);
}

@media (max-width: 600px) {
  .legal-section {
    padding: 20px;
  }
}
</style>
