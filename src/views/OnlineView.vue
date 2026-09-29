<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOnlineGame } from '../lib/useOnlineGame'
import { STORAGE, safeGet, safeSet } from '../lib/online'
import { supabaseConfigured } from '../lib/supabase'
import OnlineLobby from '../components/online/OnlineLobby.vue'
import OnlineTable from '../components/online/OnlineTable.vue'
import HowToPlay from '../components/online/HowToPlay.vue'
import '../styles/online.css'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const g = useOnlineGame()

const name = ref(safeGet(STORAGE.name) ?? '')
const joinCode = ref(String(route.query.join ?? '').toUpperCase().slice(0, 4))
const showHowTo = ref(false)

const cleanName = computed(() => name.value.trim().slice(0, 16))
const inRoom = computed(() => !!g.view.value)

const errorText = computed(() => {
  const e = g.error.value
  if (!e) return ''
  const known = ['network', 'auth_disabled', 'offline_unavailable', 'too_many_rooms']
  return known.includes(e) ? t('online.err.' + e) : e
})

async function createRoom() {
  safeSet(STORAGE.name, cleanName.value)
  await g.create(cleanName.value)
}

async function joinRoom() {
  safeSet(STORAGE.name, cleanName.value)
  const ok = await g.join(joinCode.value, cleanName.value)
  if (ok && route.query.join) router.replace({ query: {} })
}

async function leave() {
  await g.leave()
}

onMounted(async () => {
  await g.boot()
  // Première visite : tutoriel rapide.
  if (!safeGet('chatbordage.tutoSeen')) { showHowTo.value = true }
})
watch(showHowTo, v => { if (!v) safeSet('chatbordage.tutoSeen', '1') })
</script>

<template>
  <div class="online-page">
    <!-- chargement -->
    <div v-if="g.booting.value" class="center-box"><p class="loading">⚓ {{ $t('online.loading') }}</p></div>

    <!-- pas de serveur configuré -->
    <div v-else-if="!supabaseConfigured" class="center-box panel">
      <h1>⚓ ChatBordage</h1>
      <p>{{ $t('online.err.offline_unavailable') }}</p>
      <RouterLink class="btn-gold" to="/game">{{ $t('online.tabletMode') }}</RouterLink>
    </div>

    <!-- dans un salon -->
    <template v-else-if="inRoom">
      <OnlineLobby
        v-if="g.lobby.value" :lobby="g.lobby.value" :busy="g.busy.value"
        @seat="g.seat" @kick="g.kick" @start="g.start" @leave="leave" @settings="g.settings"
      />
      <OnlineTable
        v-else-if="g.game.value" :game="g.game.value" :server-now="g.serverNow.value" :busy="g.busy.value"
        :realtime-up="g.realtimeUp.value"
        @act="g.act" @leave="leave" @howto="showHowTo = true"
      />
    </template>

    <!-- accueil : créer / rejoindre -->
    <div v-else class="center-box panel">
      <img src="/favicon.png" alt="" class="logo" />
      <h1>{{ $t('online.title') }}</h1>
      <p class="sub">{{ $t('online.subtitle') }}</p>

      <label class="field">{{ $t('online.yourName') }}
        <input v-model="name" maxlength="16" :placeholder="$t('online.namePlaceholder')" autocomplete="nickname" />
      </label>

      <div class="block">
        <h2>{{ $t('online.join') }}</h2>
        <div class="join-row">
          <input v-model="joinCode" class="code-input" maxlength="4" placeholder="ABCD" autocapitalize="characters" @input="joinCode = joinCode.toUpperCase().replace(/[^A-Z]/g, '')" @keyup.enter="cleanName && joinCode.length === 4 && joinRoom()" />
          <button class="btn-gold" :disabled="g.busy.value || !cleanName || joinCode.length !== 4" @click="joinRoom">{{ $t('online.joinBtn') }}</button>
        </div>
      </div>

      <div class="block">
        <h2>{{ $t('online.create') }}</h2>
        <button class="btn-gold" :disabled="g.busy.value || !cleanName" @click="createRoom">{{ $t('online.createBtn') }}</button>
      </div>

      <p v-if="errorText" class="error" role="alert">{{ errorText }}</p>

      <div class="links">
        <button class="link" @click="showHowTo = true">📖 {{ $t('online.howto') }}</button>
        <RouterLink class="link" to="/">← {{ $t('online.backHome') }}</RouterLink>
        <RouterLink class="link" to="/game">🎲 {{ $t('online.tabletMode') }}</RouterLink>
      </div>
    </div>

    <p v-if="errorText && inRoom" class="toast" role="alert" @click="g.error.value = ''">⚠ {{ errorText }}</p>
    <HowToPlay v-if="showHowTo" @close="showHowTo = false" />
  </div>
</template>

<style scoped>
/* Fond propre : la texture de parchemin du site se répète en grosses tuiles visibles sur grand écran. */
.online-page {
  min-height: 100dvh; position: relative;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(200, 162, 74, .14) 0%, transparent 55%),
    linear-gradient(180deg, #6b1922 0%, #4f1219 100%) fixed;
  background-color: var(--color-burgundy-dark);
}
.center-box { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loading { font-family: var(--font-display); font-size: 1.8rem; color: var(--color-gold); animation: pulse 1.4s infinite; }
.panel { max-width: 460px; margin: 0 auto; padding: 24px 18px; gap: 12px; text-align: center; }
.logo { width: 72px; }
h1 { color: var(--color-gold); margin: 0; font-size: 2.4rem; }
h2 { margin: 0 0 6px; font-size: 1.3rem; }
.sub { margin: 0; color: var(--color-text-muted); }
.field { display: flex; flex-direction: column; gap: 4px; text-align: left; width: 100%; font-size: .85rem; color: var(--color-text-muted); }
input { width: 100%; padding: 12px; border-radius: 12px; border: 2px solid rgba(200, 162, 74, .5); background: rgba(0, 0, 0, .35); color: var(--color-text-light); font-size: 1.1rem; font-family: var(--font-body); }
input:focus { outline: none; border-color: var(--color-gold); }
.block { width: 100%; padding: 14px; border-radius: 16px; background: rgba(26, 15, 16, .55); border: 1px solid rgba(200, 162, 74, .3); display: flex; flex-direction: column; gap: 8px; }
.join-row { display: flex; gap: 8px; }
.code-input { text-transform: uppercase; letter-spacing: .3em; text-align: center; font-family: var(--font-display); font-size: 1.6rem; }
.mini { font-size: .8rem; color: var(--color-text-muted); margin: 0; }
.error { color: #ff8a80; margin: 0; }
.links { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.link { background: none; border: 0; color: var(--color-turquoise); text-decoration: underline; cursor: pointer; font-size: .95rem; }
.toast { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 90; max-width: 92vw; margin: 0; padding: 10px 16px; border-radius: 12px; background: #8f2620; color: #fff; box-shadow: 0 8px 20px rgba(0, 0, 0, .5); cursor: pointer; animation: slide 0.25s ease; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@keyframes slide { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
</style>
