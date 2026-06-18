<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="logo-wrap" @click="menuOpen = false">
        <img src="/favicon.png" alt="ChatBordage" class="logo-img" />
        <span class="logo-text">ChatBordage</span>
      </RouterLink>
      <button class="burger" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav-links" :class="{ open: menuOpen }">
        <RouterLink to="/" @click="menuOpen = false">{{ $t('header.home') }}</RouterLink>
        <a href="/#concept" @click="menuOpen = false">{{ $t('header.theGame') }}</a>
        <RouterLink to="/reglement" @click="menuOpen = false">{{ $t('header.rules') }}</RouterLink>
        <RouterLink to="/preinscription" class="nav-cta" @click="menuOpen = false">{{ $t('hero.preorder') }}</RouterLink>
        <select v-model="$i18n.locale" class="lang-selector" aria-label="Langue">
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const menuOpen = ref(false)
</script>

<style scoped>
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
  text-decoration: none;
  color: var(--color-cream);
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
  background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  color: var(--color-burgundy-dark) !important;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: 2px solid var(--color-gold-dark);
  box-shadow: 0 3px 0 var(--color-burgundy-dark);
  transition: transform 0.15s, box-shadow 0.15s;
}
.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 var(--color-burgundy-dark);
}
.lang-selector {
  background: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-gold);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  font-family: inherit;
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
  cursor: pointer;
}
.burger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-cream);
}

@media (max-width: 900px) {
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
}
</style>
