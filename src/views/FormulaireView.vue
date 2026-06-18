<template>
  <div class="form-page">
    <header class="form-header">
      <RouterLink to="/" class="logo-wrap">
        <img src="/favicon.png" alt="ChatBordage" class="logo-img" />
        <span class="logo-text">ChatBordage</span>
      </RouterLink>
      <button class="burger" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav-links" :class="{ open: menuOpen }">
        <RouterLink to="/">{{ $t('header.home') }}</RouterLink>
        <RouterLink to="/reglement">{{ $t('header.rules') }}</RouterLink>
      </nav>
    </header>

    <div class="hero-banner placeholder-scene" aria-hidden="true">
      <span class="placeholder-label">[ Bannière "Formulaire" à intégrer ]</span>
    </div>

    <main class="form-main container">
      <h1 class="form-title">{{ $t('form.lead') }}</h1>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="field-label">{{ $t('form.firstName') }} :</span>
          <input v-model="firstName" type="text" :placeholder="$t('form.firstNamePh')" required />
        </label>

        <label class="field">
          <span class="field-label">{{ $t('form.lastName') }} :</span>
          <input v-model="lastName" type="text" :placeholder="$t('form.lastNamePh')" required />
        </label>

        <label class="field">
          <span class="field-label">{{ $t('form.email') }} :</span>
          <input v-model="email" type="email" :placeholder="$t('form.emailPh')" required />
        </label>

        <label class="checkbox">
          <input v-model="acceptTos" type="checkbox" required />
          <span>{{ $t('form.tosAccept') }} <a href="#">{{ $t('footer.tos') }}</a></span>
        </label>

        <button type="submit" class="btn-primary submit-btn" :disabled="loading">
          {{ loading ? $t('form.sending') : $t('form.submit') }}
        </button>

        <p v-if="success" class="msg ok">{{ $t('form.success') }}</p>
        <p v-if="error" class="msg err">{{ error }}</p>
      </form>
    </main>

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
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { insertPreinscription } from '../lib/supabase'

const { t } = useI18n()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const acceptTos = ref(false)
const loading = ref(false)
const success = ref(false)
const error = ref('')
const menuOpen = ref(false)

async function submit() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const { error: err } = await insertPreinscription({
      prenom: firstName.value.trim(),
      nom: lastName.value.trim(),
      email: email.value.trim()
    })
    if (err) throw err
    success.value = true
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    acceptTos.value = false
  } catch (e: any) {
    error.value = e?.message || t('form.error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.form-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-burgundy-dark);
  border-bottom: 2px solid var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
}
.logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--color-cream);
}
.logo-img { width: 44px; height: 44px; }
.logo-text { font-family: var(--font-display); font-size: 26px; }
.nav-links { display: flex; gap: 24px; }
.nav-links a {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
}
.burger {
  display: none;
  background: var(--color-burgundy);
  border: none;
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  flex-direction: column;
  justify-content: center; align-items: center;
  gap: 5px; padding: 10px;
}
.burger span { display: block; width: 22px; height: 2px; background: var(--color-cream); }

.hero-banner {
  min-height: clamp(220px, 32vw, 360px);
  margin: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  border-bottom: 2px solid var(--color-gold);
}
.placeholder-scene {
  background: repeating-linear-gradient(
    45deg,
    rgba(200, 162, 74, 0.12),
    rgba(200, 162, 74, 0.12) 12px,
    rgba(200, 162, 74, 0.06) 12px,
    rgba(200, 162, 74, 0.06) 24px
  );
  border: 2px dashed var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-label {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--color-gold);
}

.form-main {
  padding: clamp(32px, 6vw, 64px) 20px;
  max-width: 560px;
  flex: 1;
}
.form-title {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: clamp(18px, 2.4vw, 22px);
  text-align: center;
  margin-bottom: 32px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 15px; font-weight: 500; }
.field input {
  background: var(--color-burgundy-dark);
  border: 1px solid var(--color-gold-dark);
  color: var(--color-text-light);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: inherit;
}
.field input::placeholder { color: var(--color-text-muted); opacity: 0.7; }
.field input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(200, 162, 74, 0.2);
}
.checkbox {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.5;
}
.checkbox input { margin-top: 3px; accent-color: var(--color-gold); }
.checkbox a { color: var(--color-gold); }
.submit-btn {
  margin-top: 12px;
  align-self: center;
  min-width: 200px;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.msg {
  text-align: center;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
}
.msg.ok { background: rgba(58, 170, 176, 0.2); color: var(--color-turquoise); }
.msg.err { background: rgba(255, 80, 80, 0.18); color: #ffb3b3; }

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
.socials { display: flex; gap: 12px; margin-bottom: 8px; }
.dot {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-burgundy);
}

@media (max-width: 720px) {
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0; right: 0;
    background: var(--color-burgundy-dark);
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    border-bottom: 2px solid var(--color-gold);
  }
  .nav-links.open { display: flex; }
  .burger { display: flex; }
  .form-header { position: relative; }
}
</style>
