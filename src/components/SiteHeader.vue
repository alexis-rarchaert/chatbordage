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
        <RouterLink to="/boutique" @click="menuOpen = false">{{ $t('header.shop') }}</RouterLink>
        <RouterLink to="/preinscription" class="nav-cta" @click="menuOpen = false">{{ $t('hero.preorder') }}</RouterLink>
        <RouterLink to="/panier" class="cart-link" aria-label="Panier" @click="menuOpen = false">
          <span class="cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M3 4h2l2.5 11.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5L21 8H6" />
            </svg>
          </span>
          <span v-if="totalItems > 0" class="cart-count">{{ totalItems }}</span>
        </RouterLink>
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
import { useCart } from '../lib/cart'

const menuOpen = ref(false)
const { totalItems } = useCart()
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
.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-gold);
  color: var(--color-cream);
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.cart-link:hover {
  background: rgba(200, 162, 74, 0.15);
  color: var(--color-gold) !important;
  border-color: var(--color-gold);
}
.cart-link.router-link-active {
  background: var(--color-gold);
  color: var(--color-burgundy-dark) !important;
}
.cart-icon { display: inline-flex; }
.cart-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: var(--color-gold);
  color: var(--color-burgundy-dark);
  border: 2px solid var(--color-burgundy-dark);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
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
