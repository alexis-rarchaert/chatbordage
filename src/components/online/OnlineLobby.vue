<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LobbyView } from '../../game'
import { SHIPS } from '../../game'
import { shipI18nKey } from '../../lib/gameLabels'
import RoomChat from './RoomChat.vue'

const props = defineProps<{ lobby: LobbyView; busy: boolean }>()
const emit = defineEmits<{
  (e: 'seat', patch: { shipId?: string | null; ready?: boolean }): void
  (e: 'kick', id: string): void
  (e: 'start'): void
  (e: 'leave'): void
  (e: 'chat', text: string): void
  (e: 'sit'): void
  (e: 'settings', s: Record<string, number>): void
}>()

const me = computed(() => props.lobby.seats.find(s => s.userId === props.lobby.youId))
const spectator = computed(() => props.lobby.isSpectator)
const full = computed(() => props.lobby.seats.length >= props.lobby.maxPlayers)
const isHost = computed(() => props.lobby.hostId === props.lobby.youId)
const takenBy = (shipId: string) => props.lobby.seats.find(s => s.shipId === shipId)
const iAmReady = computed(() => !!me.value?.ready)
const enough = computed(() => props.lobby.seats.length >= props.lobby.minPlayers)
const allReady = computed(() => props.lobby.seats.every(s => s.userId === props.lobby.hostId || s.ready))
const canStart = computed(() => isHost.value && enough.value && allReady.value && !props.busy)

const link = computed(() => `${location.origin}/online?join=${props.lobby.roomCode}`)
const copied = ref(false)
async function share() {
  const data = { title: 'ChatBordage', text: `Rejoins ma partie de ChatBordage ! Code : ${props.lobby.roomCode}`, url: link.value }
  try {
    if (navigator.share) { await navigator.share(data); return }
    await navigator.clipboard.writeText(link.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch { /* partage annulé */ }
}

const notifAsked = ref(typeof Notification === 'undefined' || Notification.permission !== 'default')
async function askNotifications() {
  try { await Notification.requestPermission() } finally { notifAsked.value = true }
}

const turnOptions = [60, 90, 120, 0]
</script>

<template>
  <div class="lobby">
    <h1>{{ $t('online.lobbyTitle') }}</h1>

    <div class="code-box">
      <span class="code-l">{{ $t('online.roomCode') }}</span>
      <span class="code" @click="share">{{ lobby.roomCode }}</span>
      <button class="btn-ghost" @click="share">{{ copied ? '✓ ' + $t('online.copied') : '🔗 ' + $t('online.invite') }}</button>
    </div>

    <ul class="seats">
      <li v-for="s in lobby.seats" :key="s.userId" :class="{ ready: s.ready || s.userId === lobby.hostId, me: s.userId === lobby.youId }">
        <img v-if="s.shipId" :src="SHIPS.find(x => x.id === s.shipId)!.image" alt="" />
        <span v-else class="noship">❓</span>
        <span class="n">{{ s.name }} <em v-if="s.userId === lobby.hostId">👑 {{ $t('online.host') }}</em></span>
        <span class="st">{{ s.userId === lobby.hostId || s.ready ? '✅' : '⏳' }}</span>
        <button v-if="isHost && s.userId !== lobby.hostId" class="kick" @click="emit('kick', s.userId)" :title="$t('online.kick')">✕</button>
      </li>
      <li v-for="i in Math.max(0, lobby.minPlayers - lobby.seats.length)" :key="'empty' + i" class="empty">{{ $t('online.waitingPlayer') }}</li>
    </ul>

    <p v-if="lobby.spectators.length" class="mini">👁 {{ $t('online.spectatorsList', { names: lobby.spectators.join(', ') }) }}</p>

    <template v-if="!spectator && me">
    <h2>{{ $t('online.chooseShip') }}</h2>
    <div class="ships">
      <button class="ship random" :class="{ on: me.shipId === null }" :disabled="iAmReady" @click="emit('seat', { shipId: null })">🎲<span>{{ $t('online.random') }}</span></button>
      <button
        v-for="s in SHIPS" :key="s.id" class="ship"
        :class="{ on: me.shipId === s.id, taken: takenBy(s.id) && takenBy(s.id)!.userId !== me.userId }"
        :disabled="iAmReady || (!!takenBy(s.id) && takenBy(s.id)!.userId !== me.userId)"
        @click="emit('seat', { shipId: s.id })"
      >
        <img :src="s.image" :alt="s.name" />
        <span>{{ $t('ships.' + shipI18nKey(s.id) + '.name') }}</span>
        <small>❤ {{ s.hp }} · ⚔ {{ s.damage }}</small>
        <small class="ab">{{ $t('ships.' + shipI18nKey(s.id) + '.ability') }}</small>
        <b v-if="takenBy(s.id) && takenBy(s.id)!.userId !== me.userId" class="by">{{ takenBy(s.id)!.name }}</b>
      </button>
    </div>

    </template>

    <div v-if="isHost" class="settings">
      <label>{{ $t('online.turnTimer') }}
        <select :value="lobby.settings.turnSeconds" @change="emit('settings', { turnSeconds: Number(($event.target as HTMLSelectElement).value) })">
          <option v-for="o in turnOptions" :key="o" :value="o">{{ o ? o + ' s' : $t('online.noTimer') }}</option>
        </select>
      </label>
    </div>
    <p v-else class="mini">{{ $t('online.turnTimer') }} : {{ lobby.settings.turnSeconds ? lobby.settings.turnSeconds + ' s' : $t('online.noTimer') }}</p>

    <h2>💬 {{ $t('online.chatTitle') }}</h2>
    <RoomChat :messages="lobby.roomChat" :you-id="lobby.youId" @send="emit('chat', $event)" />

    <div class="cta">
      <template v-if="spectator">
        <p class="mini">👁 {{ $t('online.spectatorLobby') }}</p>
        <button class="btn-gold big" :disabled="busy || full" @click="emit('sit')">{{ full ? $t('online.shipFull') : $t('online.takeSeat') }}</button>
      </template>
      <button v-if="!notifAsked && !spectator" class="btn-ghost" @click="askNotifications">🔔 {{ $t('online.enableNotifs') }}</button>
      <template v-if="isHost && !spectator">
        <button class="btn-gold big" :disabled="!canStart" @click="emit('start')">⚓ {{ $t('online.startGame') }}</button>
        <p v-if="!enough" class="mini">{{ $t('online.needPlayers', { n: lobby.minPlayers }) }}</p>
        <p v-else-if="!allReady" class="mini">{{ $t('online.notAllReady') }}</p>
      </template>
      <button v-else-if="!spectator && me" class="btn-gold big" :disabled="busy" @click="emit('seat', { ready: !me.ready })">{{ me.ready ? $t('online.notReady') : $t('online.imReady') }}</button>
      <button class="btn-ghost" @click="emit('leave')">{{ $t('online.leave') }}</button>
    </div>
  </div>
</template>

<style scoped>
.lobby { max-width: 760px; margin: 0 auto; padding: 16px 14px 40px; display: flex; flex-direction: column; gap: 10px; }
h1 { text-align: center; color: var(--color-gold); margin: 6px 0; }
h2 { font-size: 1.3rem; margin: 10px 0 0; }
.code-box { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; padding: 12px; border-radius: 16px; background: rgba(0, 0, 0, .3); border: 2px dashed var(--color-gold); }
.code-l { font-size: .8rem; text-transform: uppercase; color: var(--color-text-muted); }
.code { font-family: var(--font-display); font-size: 3rem; letter-spacing: .3em; color: var(--color-gold); cursor: pointer; padding-left: .3em; }
.seats { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.seats li { display: grid; grid-template-columns: 48px 1fr auto auto; align-items: center; gap: 10px; padding: 6px 12px; border-radius: 12px; background: rgba(26, 15, 16, .55); border: 1px solid rgba(200, 162, 74, .2); }
.seats li.me { border-color: var(--color-turquoise); }
.seats li.empty { display: block; text-align: center; color: var(--color-text-muted); border-style: dashed; opacity: .6; }
.seats img { max-height: 34px; max-width: 48px; object-fit: contain; }
.noship { text-align: center; font-size: 1.4rem; opacity: .5; }
.n em { font-size: .72rem; color: var(--color-gold); font-style: normal; }
.kick { background: none; border: 0; color: #ff7268; cursor: pointer; font-size: 1.1rem; }
.ships { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; }
.ship { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 6px; border-radius: 14px; background: rgba(26, 15, 16, .55); border: 2px solid rgba(200, 162, 74, .2); color: var(--color-text-light); cursor: pointer; text-align: center; transition: transform .15s, border-color .15s; }
.ship img { height: 44px; object-fit: contain; }
.ship span { font-family: var(--font-display); font-size: .95rem; }
.ship small { font-size: .68rem; color: var(--color-text-muted); }
.ship .ab { line-height: 1.15; }
.ship:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--color-turquoise); }
.ship.on { border-color: var(--color-gold); background: rgba(200, 162, 74, .2); box-shadow: 0 0 14px rgba(200, 162, 74, .5); }
.ship.taken { opacity: .4; }
.ship.random { justify-content: center; font-size: 2rem; }
.by { position: absolute; top: 4px; right: 4px; font-size: .62rem; background: var(--color-burgundy); padding: 1px 6px; border-radius: 999px; }
.settings { display: flex; justify-content: center; }
.settings select { margin-left: 8px; padding: 6px 10px; border-radius: 8px; }
.mini { font-size: .8rem; color: var(--color-text-muted); text-align: center; margin: 0; }
.cta { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 12px; }
.btn-gold.big { width: min(420px, 100%); padding: 14px; font-size: 1.4rem; }
</style>
