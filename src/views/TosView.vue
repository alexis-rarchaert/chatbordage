<template>
  <div class="tos-page">
    <SiteHeader />

    <div class="tos-banner">
      <img src="/hero-banner.webp" alt="" class="tos-banner-img" />
      <h1 class="tos-banner-title">{{ $t('tosPage.title') }}</h1>
    </div>

    <main class="tos-main container">
      <div class="tos-content">
        <section class="tos-section" v-reveal>
          <h2>{{ $t('tosPage.sections.purpose.title') }}</h2>
          <p>{{ $t('tosPage.sections.purpose.content') }}</p>
        </section>

        <section class="tos-section" v-reveal>
          <h2>{{ $t('tosPage.sections.validation.title') }}</h2>
          <p>{{ $t('tosPage.sections.validation.content') }}</p>
        </section>

        <section class="tos-section" v-reveal>
          <h2>{{ $t('tosPage.sections.prices.title') }}</h2>
          <p>{{ $t('tosPage.sections.prices.content') }}</p>
        </section>

        <section class="tos-section" v-reveal>
          <h2>{{ $t('tosPage.sections.delivery.title') }}</h2>
          <p>{{ $t('tosPage.sections.delivery.content') }}</p>
        </section>

        <section class="tos-section" v-reveal>
          <h2>{{ $t('tosPage.sections.withdrawal.title') }}</h2>
          <p>{{ $t('tosPage.sections.withdrawal.content') }}</p>
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
.tos-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tos-banner {
  position: relative;
  min-height: clamp(180px, 26vw, 280px);
  border-bottom: 3px solid var(--color-gold);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tos-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tos-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(107, 25, 34, 0.4) 100%);
}

.tos-banner-title {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(36px, 5.5vw, 64px);
  text-shadow: 0 3px 0 var(--color-burgundy-dark), 0 6px 16px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
  text-align: center;
  padding: 0 20px;
}

.tos-main {
  flex: 1;
  padding: 48px 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.tos-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.tos-section {
  padding: 28px 32px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.7) 0%, rgba(60, 12, 18, 0.7) 100%);
  border: 1px solid rgba(200, 162, 74, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.tos-section h2 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 28px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(200, 162, 74, 0.2);
  padding-bottom: 8px;
}

.tos-section p {
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-light);
}

@media (max-width: 600px) {
  .tos-section {
    padding: 20px;
  }
}
</style>
