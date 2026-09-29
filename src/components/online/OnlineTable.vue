<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Action, Card, GameView, PublicPlayer } from '../../game'
import { CHAT_EMOJIS, CHAT_PHRASES, cardTargets, isPlayable, roleOf, shipI18nKey, shipOf } from '../../lib/gameLabels'
import { safeGet, safeSet } from '../../lib/online'
import { muted, play, setMuted, unlockAudio } from '../../lib/sfx'
import CardFace from './CardFace.vue'
import PlayerSeat from './PlayerSeat.vue'
import TargetPicker from './TargetPicker.vue'
import CardPicker from './CardPicker.vue'
import RoomChat from './RoomChat.vue'

const props = defineProps<{ game: GameView; serverNow: number; busy: boolean; realtimeUp: boolean }>()
const emit = defineEmits<{
  (e: 'act', a: Action): void; (e: 'leave'): void; (e: 'howto'): void
  (e: 'chat', text: string): void; (e: 'rematch'): void
}>()

const { t } = useI18n()

// ---------- données dérivées ----------
// Un spectateur n'est pas dans la liste des joueurs : on lui donne un joueur « vide » (éliminé), ce qui
// désactive naturellement toutes les actions ; la partie « mon plateau » est de toute façon masquée.
const SPECTATOR_STUB: PublicPlayer = {
  id: '', name: '', shipId: 'fregate', hp: 0, maxHp: 0, coins: 0, isAlive: false, handCount: 0,
  permanents: [], eliminationsCount: 0, truceTurnsLeft: 0, powerUsedThisGame: false, roleId: null
}
const spectator = computed(() => props.game.isSpectator)
const me = computed(() => props.game.players.find(p => p.id === props.game.youId) ?? SPECTATOR_STUB)
const others = computed(() => props.game.players.filter(p => p.id !== props.game.youId))
const livingOthers = computed(() => others.value.filter(p => p.isAlive))
const current = computed(() => props.game.players.find(p => p.id === props.game.currentPlayerId)!)
const isMyTurn = computed(() => props.game.currentPlayerId === props.game.youId && me.value.isAlive)
const finished = computed(() => props.game.status === 'finished')
const myShip = computed(() => shipOf(me.value.shipId))
const myRole = computed(() => (props.game.you.roleId ? roleOf(props.game.you.roleId) : null))
const handMax = computed(() => (me.value.shipId === 'galion' ? 6 : 5))
const drawAmount = computed(() => 2 + (props.game.event?.id === 'vents' ? 1 : 0))
const coinAmount = computed(() => 2 + (me.value.shipId === 'gabare' ? 1 : 0))
// Les Rumeurs peuvent viser n'importe quel joueur vivant, soi-même compris ; les attaques, les autres seulement.
const targetPlayers = computed(() =>
  selectedCard.value?.family === 'RUMEUR' ? props.game.players.filter(p => p.isAlive) : livingOthers.value
)
const shopDiscount = computed(() => (props.game.event?.id === 'aubaine' ? 1 : 0))
const priceOf = (price: number) => Math.max(1, price - shopDiscount.value)

const pendingAttack = computed(() => (props.game.pending?.kind === 'attack' ? props.game.pending : null))
const pendingScry = computed(() => (props.game.pending?.kind === 'scry' && props.game.pending.playerId === props.game.youId ? props.game.pending : null))
const canAct = computed(() => isMyTurn.value && props.game.phase === 'action' && !props.game.pending && !props.busy)

const deadline = computed(() => pendingAttack.value?.deadline ?? props.game.turnDeadline ?? null)
const secondsLeft = computed(() => (deadline.value ? Math.max(0, Math.ceil((deadline.value - props.serverNow) / 1000)) : null))

const nameOf = (id: string) => props.game.players.find(p => p.id === id)?.name ?? '?'

// ---------- interactions ----------
const selectedId = ref<string | null>(null)
const selectedCard = computed(() => props.game.you.hand.find(c => c.id === selectedId.value) ?? null)
watch(() => props.game.you.hand, hand => { if (selectedId.value && !hand.some(c => c.id === selectedId.value)) selectedId.value = null })

type Sheet = null | 'target-card' | 'shop' | 'discard' | 'sloop' | 'cotre' | 'reveal' | 'log' | 'chat' | 'role' | 'ship' | 'notes'
const sheet = ref<Sheet>(null)
const revealItemId = ref<string | null>(null)
const seatInfo = ref<string | null>(null)

function selectCard(c: Card) {
  if (!canAct.value) return
  selectedId.value = selectedId.value === c.id ? null : c.id
}

function playSelected() {
  const c = selectedCard.value
  if (!c || !canAct.value) return
  const need = cardTargets(c)
  if (need === 'none') { emit('act', { type: 'play', cardId: c.id }); selectedId.value = null }
  else sheet.value = 'target-card'
}

function onTargetCard(ids: string[]) {
  const c = selectedCard.value
  sheet.value = null
  if (!c) return
  emit('act', { type: 'play', cardId: c.id, targetId: ids[0], targetIds: ids })
  selectedId.value = null
}

function discardSelected() {
  const c = selectedCard.value
  if (!c || !canAct.value) return
  emit('act', { type: 'discard', cardId: c.id })
  selectedId.value = null
}

function endTurn() {
  if (!canAct.value) return
  if (props.game.you.hand.length > handMax.value) sheet.value = 'discard'
  else emit('act', { type: 'end' })
}

const activePower = computed(() => {
  const s = myShip.value
  if (!s || s.powerType === 'passif' || s.powerType === 'passif-trigger') return null
  if (s.id === 'corvette') return { ship: s, usable: false, hint: t('online.corvetteHint') }
  const used = s.powerType === 'actif-tour' ? props.game.you.powerUsedThisTurn : me.value.powerUsedThisGame
  return { ship: s, usable: !used, hint: used ? t('online.powerUsed') : '' }
})

function usePower() {
  const ap = activePower.value
  if (!ap || !ap.usable || !canAct.value) return
  if (ap.ship.id === 'sloop') sheet.value = 'sloop'
  else if (ap.ship.id === 'cotre') sheet.value = 'cotre'
  else emit('act', { type: 'power' })
}

function buy(itemId: string, effect: string) {
  if (effect === 'REVEAL_ROLE') { revealItemId.value = itemId; sheet.value = 'reveal'; return }
  emit('act', { type: 'buy', itemId })
}

function onReveal(ids: string[]) {
  if (revealItemId.value) emit('act', { type: 'buy', itemId: revealItemId.value, targetId: ids[0] })
  revealItemId.value = null
  sheet.value = null
}

// ---------- réaction ----------
const reactionOpen = computed(() => !!pendingAttack.value?.youMustRespond)

// ---------- rôle secret : à révéler en maintenant appuyé ----------
const roleKey = computed(() => `chatbordage.roleSeen.${props.game.id}`)
const roleGate = ref(!props.game.isSpectator && safeGet(roleKey.value) !== '1')
const roleHeld = ref(false)
function closeRoleGate() { roleGate.value = false; safeSet(roleKey.value, '1') }

// ---------- sons ----------
watch(isMyTurn, (now, before) => { if (now && !before) play('turn') })
watch(() => props.game.turnNumber, (now, before) => { if (now !== before) play('event') })
watch(pendingAttack, (a, before) => {
  if (a && !before) play(a.youMustRespond ? 'alarm' : 'attack')
})
watch(() => props.game.players.map(p => `${p.id}|${p.hp}|${p.isAlive}|${p.coins}|${p.handCount}`).join(','), (now, before) => {
  if (!before) return
  const prev = new Map(before.split(',').map(x => x.split('|') as [string, string, string, string, string]).map(x => [x[0], x]))
  for (const p of props.game.players) {
    const o = prev.get(p.id)
    if (!o) continue
    if (o[2] === 'true' && !p.isAlive) { play('sink'); continue }
    if (p.hp < Number(o[1])) play('hit')
    else if (p.hp > Number(o[1]) && p.id === props.game.youId) play('heal')
    if (p.id === props.game.youId) {
      if (p.coins > Number(o[3])) play('coin')
      if (p.handCount > Number(o[4])) play('draw')
      else if (p.handCount < Number(o[4]) && !pendingAttack.value) play('play')
    }
  }
})
watch(() => props.game.log.length, (now, before) => {
  if (now <= before) return
  const fresh = props.game.log.slice(-(now - before))
  if (fresh.some(l => /esquive|amortit|renvoie/i.test(l))) play('block')
})
watch(() => props.game.chat.length, (now, before) => { if (now > before) play('chat') })
watch(() => props.game.roomChat.at(-1)?.id, (id, before) => {
  const last = props.game.roomChat.at(-1)
  if (id !== undefined && id !== before && last && last.userId !== props.game.youId) play('chat')
})
watch(() => props.game.status, st => {
  if (st !== 'finished') return
  play(spectator.value || props.game.winnerIds.includes(props.game.youId) ? 'victory' : 'defeat')
})

// ---------- effets visuels ----------
const hurt = ref(false)
watch(() => me.value.hp, (now, before) => {
  if (now < before) { hurt.value = true; setTimeout(() => (hurt.value = false), 700) }
})
const attackedIds = computed(() => new Set(pendingAttack.value?.targetIds ?? []))

// ---------- chat rapide ----------
const chatVisible = ref<Record<number, boolean>>({})
let chatInit = false
watch(() => props.game.chat, list => {
  if (!chatInit) { chatInit = true; list.forEach(m => (chatVisible.value[m.id] = false)); return }
  for (const m of list) {
    if (!(m.id in chatVisible.value)) {
      chatVisible.value[m.id] = true
      setTimeout(() => (chatVisible.value[m.id] = false), 5000)
    }
  }
}, { immediate: true, deep: true })
const shownChat = computed(() => props.game.chat.filter(m => chatVisible.value[m.id]).slice(-3))
const chatText = (key: string) => (CHAT_PHRASES.includes(key) ? t('online.chat.' + key) : key)
function sendChat(key: string) { emit('act', { type: 'chat', key }); sheet.value = null }

// Chat libre du salon : compteur de messages non lus tant que la fenêtre est fermée.
const lastSeenChat = ref(props.game.roomChat.at(-1)?.id ?? 0)
const unreadChat = computed(() => props.game.roomChat.filter(m => m.id > lastSeenChat.value && m.userId !== props.game.youId).length)
watch([sheet, () => props.game.roomChat.length], () => {
  if (sheet.value === 'chat') lastSeenChat.value = props.game.roomChat.at(-1)?.id ?? 0
})

// ---------- fin de partie ----------
const iWon = computed(() => props.game.winnerIds.includes(props.game.youId))
const winnerNames = computed(() => props.game.winnerIds.map(nameOf).join(' & '))
const lastLogs = computed(() => props.game.log.slice(-3))
const reversedLog = computed(() => [...props.game.log].reverse())
const mainLog = computed(() => props.game.log.filter(l => l.startsWith('Victoire') || l.startsWith('Tout l'))[0] ?? '')

const phaseHint = computed(() => {
  if (finished.value) return ''
  if (spectator.value) return t('online.hint.watching', { name: current.value.name })
  if (!me.value.isAlive) return t('online.hint.spectating')
  if (pendingAttack.value) return t('online.hint.reaction', { who: nameOf(pendingAttack.value.attackerId) })
  if (pendingScry.value) return t('online.hint.scry')
  if (!isMyTurn.value) return t('online.hint.waiting', { name: current.value.name })
  if (props.game.phase === 'draw') return t('online.hint.resources')
  return t('online.hint.action')
})
</script>

<template>
  <div class="table" :class="{ hurt }" @pointerdown.once="unlockAudio">
    <!-- ===== barre du haut ===== -->
    <header class="topbar">
      <button class="chip" @click="emit('leave')" :title="$t('online.leave')">⬅</button>
      <div class="event" :key="game.turnNumber" v-if="game.event">
        <strong>{{ game.event.name }}</strong>
        <span>{{ game.event.description }}</span>
      </div>
      <div class="timer" v-if="secondsLeft !== null" :class="{ urgent: secondsLeft <= 10 }">⏳ {{ secondsLeft }}s</div>
      <span v-if="game.spectators.length" class="chip" :title="game.spectators.join(', ')">👁 {{ game.spectators.length }}</span>
      <button class="chip" :class="{ ping: unreadChat }" @click="sheet = 'chat'" :aria-label="$t('online.chatTitle')">💬<b v-if="unreadChat" class="badge">{{ unreadChat }}</b></button>
      <button class="chip" @click="setMuted(!muted)" :title="muted ? $t('online.soundOn') : $t('online.soundOff')">{{ muted ? '🔇' : '🔊' }}</button>
      <span class="net" :class="{ up: realtimeUp }" :title="realtimeUp ? 'Temps réel' : 'Reconnexion…'">●</span>
      <button class="chip" @click="emit('howto')" :title="$t('online.howto')">?</button>
    </header>

    <!-- ===== adversaires ===== -->
    <section class="opponents" :aria-label="$t('online.opponents')">
      <button v-for="p in others" :key="p.id" class="seat-btn" @click="seatInfo = p.id">
        <PlayerSeat :player="p" :active="p.id === game.currentPlayerId" :attacked="attackedIds.has(p.id)" :winner="game.winnerIds.includes(p.id)" />
      </button>
    </section>

    <!-- ===== centre : pioche, journal, bulles ===== -->
    <section class="center">
      <div class="piles">
        <div class="pile"><span class="pile-n">{{ game.deckCount }}</span><span class="pile-l">{{ $t('online.deck') }}</span></div>
        <div class="pile discard">
          <CardFace v-if="game.discardTop" :card="game.discardTop" small />
          <span v-else class="pile-n">0</span>
          <span class="pile-l">{{ $t('online.discard') }} · {{ game.discardCount }}</span>
        </div>
      </div>
      <button class="log-mini" @click="sheet = 'log'">
        <p v-for="(l, i) in lastLogs" :key="game.log.length + '-' + i" :class="{ latest: i === lastLogs.length - 1 }">{{ l }}</p>
      </button>
      <transition-group name="bubble" tag="div" class="bubbles">
        <div v-for="m in shownChat" :key="m.id" class="bubble"><b>{{ nameOf(m.playerId) }}</b> {{ chatText(m.key) }}</div>
      </transition-group>
    </section>

    <p class="hint" :class="{ mine: isMyTurn && !finished }">{{ phaseHint }}</p>

    <!-- ===== mon plateau ===== -->
    <section v-if="!spectator" class="mine" :class="{ dead: !me.isAlive }">
      <div class="mine-head">
        <PlayerSeat :player="me" :active="isMyTurn" you class="mine-seat" />
        <div class="mine-side">
          <button v-if="myRole" class="chip wide" @click="sheet = 'role'">🎭 {{ $t('roles.' + myRole.id + '.name') }}</button>
          <button class="chip wide" @click="sheet = 'ship'">🚢 {{ $t('ships.' + shipI18nKey(me.shipId) + '.name') }}</button>
          <button class="chip wide" @click="sheet = 'notes'" :class="{ ping: game.you.notes.length }">🔎 {{ $t('online.secret') }} ({{ game.you.notes.length }})</button>
          <p v-if="game.you.buffNextAttack" class="mini">💣 +{{ game.you.buffNextAttack }} {{ $t('online.nextAttack') }}</p>
          <p v-if="game.you.revivePending" class="mini">✝️ {{ $t('online.reviveReady') }}</p>
        </div>
      </div>

      <!-- choix de ressources -->
      <div v-if="isMyTurn && game.phase === 'draw' && !game.pending" class="resources">
        <button class="btn-gold big" :disabled="busy" @click="emit('act', { type: 'draw' })">🃏 {{ $t('online.drawN', { n: drawAmount }) }}</button>
        <button class="btn-gold big" :disabled="busy" @click="emit('act', { type: 'coins' })">🪙 {{ $t('online.coinsN', { n: coinAmount }) }}</button>
        <p v-if="me.shipId === 'caravelle'" class="mini center-t full">🃏 {{ $t('online.caravelleFree') }}</p>
      </div>

      <!-- main -->
      <div class="hand" v-else-if="me.isAlive">
        <transition-group name="card" tag="div" class="hand-row">
          <button
            v-for="c in game.you.hand" :key="c.id" class="hand-card"
            :class="{ locked: !canAct || !isPlayable(c) }"
            @click="selectCard(c)"
          >
            <CardFace :card="c" :selected="selectedId === c.id" :disabled="!isPlayable(c)" />
          </button>
        </transition-group>
        <p v-if="!game.you.hand.length" class="empty">{{ $t('online.emptyHand') }}</p>
      </div>

      <!-- barre d'actions -->
      <div class="actions" v-if="canAct">
        <button class="btn-gold" :disabled="!selectedCard || selectedCard.family === 'VOILE' || (selectedCard.family === 'ABORDAGE' && game.you.noAttackThisTurn)" @click="playSelected">
          {{ selectedCard ? (selectedCard.family === 'VOILE' ? $t('online.voileHint') : $t('online.play', { name: selectedCard.name })) : $t('online.pickCard') }}
        </button>
        <div class="row">
          <button v-if="selectedCard" class="btn-ghost" @click="discardSelected">🗑 {{ $t('online.discardOne') }}</button>
          <button class="btn-ghost" @click="sheet = 'shop'">🛒 {{ $t('online.shop') }}</button>
          <button v-if="activePower" class="btn-ghost" :disabled="!activePower.usable" :title="activePower.hint" @click="usePower">⚡ {{ $t('online.power') }}</button>
          <button class="btn-ghost" @click="endTurn">⏭ {{ $t('online.endTurn') }}</button>
        </div>
        <p v-if="game.you.noAttackThisTurn" class="mini">😴 {{ $t('online.noAttackTurn') }}</p>
        <p v-if="activePower && activePower.hint" class="mini">{{ activePower.hint }}</p>
      </div>
      <div class="actions" v-else-if="me.isAlive && !finished">
        <div class="row">
          <button class="btn-ghost" @click="sheet = 'shop'">🛒 {{ $t('online.shop') }}</button>
        </div>
      </div>
    </section>

    <!-- ===== feuilles ===== -->
    <TargetPicker v-if="sheet === 'target-card' && selectedCard" :title="$t('online.pickTarget', { name: selectedCard.name })" :players="targetPlayers" :max="cardTargets(selectedCard) === 'two' ? 2 : 1" @pick="onTargetCard" @cancel="sheet = null" />
    <TargetPicker v-if="sheet === 'cotre'" :title="$t('online.cotrePick')" :players="livingOthers.filter(p => p.handCount > 0)" @pick="ids => { sheet = null; emit('act', { type: 'power', targetId: ids[0] }) }" @cancel="sheet = null" />
    <TargetPicker v-if="sheet === 'reveal'" :title="$t('online.revealPick')" :players="livingOthers" @pick="onReveal" @cancel="sheet = null; revealItemId = null" />
    <CardPicker v-if="sheet === 'sloop'" :title="$t('online.sloopPick')" :cards="game.you.hand" @pick="ids => { sheet = null; emit('act', { type: 'power', cardId: ids[0] }) }" @cancel="sheet = null" />
    <CardPicker v-if="sheet === 'discard'" :title="$t('online.discardPick', { n: game.you.hand.length - handMax })" :cards="game.you.hand" :count="game.you.hand.length - handMax" :confirm-label="$t('online.endTurn')" @pick="ids => { sheet = null; emit('act', { type: 'end', discardIds: ids }) }" @cancel="sheet = null" />

    <!-- boutique -->
    <div v-if="sheet === 'shop'" class="sheet-backdrop" @click.self="sheet = null">
      <div class="sheet">
        <h3>🛒 {{ $t('online.shop') }} — 🪙 {{ me.coins }}</h3>
        <p class="mini center-t">{{ $t('online.shopHint') }}<span v-if="shopDiscount"> · {{ $t('online.aubaine') }}</span></p>
        <ul class="shop">
          <li v-for="item in game.shop" :key="item.id">
            <div><strong>{{ item.name }}</strong><small>{{ item.description }}</small></div>
            <button class="btn-gold" :disabled="!canAct || me.coins < priceOf(item.price)" @click="buy(item.id, item.effect)">🪙 {{ priceOf(item.price) }}</button>
          </li>
        </ul>
        <p v-if="!game.shop.length" class="empty">{{ $t('online.shopEmpty') }}</p>
        <div class="actions"><button class="btn-ghost" @click="sheet = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>

    <!-- journal -->
    <div v-if="sheet === 'log'" class="sheet-backdrop" @click.self="sheet = null">
      <div class="sheet">
        <h3>{{ $t('online.logTitle') }}</h3>
        <ol class="log-full"><li v-for="(l, i) in reversedLog" :key="i">{{ l }}</li></ol>
        <div class="actions"><button class="btn-ghost" @click="sheet = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>

    <!-- chat -->
    <div v-if="sheet === 'chat'" class="sheet-backdrop" @click.self="sheet = null">
      <div class="sheet">
        <h3>💬 {{ $t('online.chatTitle') }}</h3>
        <RoomChat :messages="game.roomChat" :you-id="game.youId" @send="emit('chat', $event)" />
        <div v-if="!spectator && me.isAlive" class="chat-grid">
          <button v-for="e in CHAT_EMOJIS" :key="e" class="chat-btn emoji" @click="sendChat(e)">{{ e }}</button>
          <button v-for="p in CHAT_PHRASES" :key="p" class="chat-btn" @click="sendChat(p)">{{ $t('online.chat.' + p) }}</button>
        </div>
        <div class="actions"><button class="btn-ghost" @click="sheet = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>

    <!-- rôle / navire / notes -->
    <div v-if="sheet === 'role' && myRole" class="sheet-backdrop" @click.self="sheet = null">
      <div class="sheet info">
        <h3>{{ $t('roles.' + myRole.id + '.name') }}</h3>
        <img :src="myRole.catImage" :alt="myRole.catName" class="cat" />
        <p>{{ $t('roles.' + myRole.id + '.mission') }}</p>
        <p class="mini">{{ $t('online.roleSecret') }}</p>
        <div class="actions"><button class="btn-ghost" @click="sheet = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>
    <div v-if="sheet === 'ship' || seatInfo" class="sheet-backdrop" @click.self="sheet = null; seatInfo = null">
      <div class="sheet info">
        <template v-for="pl in [game.players.find(p => p.id === (seatInfo ?? game.youId))!]" :key="pl.id">
          <h3>{{ pl.name }}</h3>
          <img :src="shipOf(pl.shipId)!.image" :alt="shipOf(pl.shipId)!.name" class="ship-big" />
          <p><strong>{{ $t('ships.' + shipI18nKey(pl.shipId) + '.name') }}</strong> — {{ pl.hp }}/{{ pl.maxHp }} ❤ · 🪙 {{ pl.coins }} · 🃏 {{ pl.handCount }}</p>
          <p>{{ $t('ships.' + shipI18nKey(pl.shipId) + '.ability') }}</p>
          <p v-if="pl.roleId" class="mini">🎭 {{ $t('roles.' + pl.roleId + '.name') }}</p>
          <div v-if="pl.permanents.length" class="equip">
            <h4>{{ $t('online.equipment') }}</h4>
            <CardFace v-for="c in pl.permanents" :key="c.id" :card="c" />
          </div>
          <p v-if="pl.truceTurnsLeft" class="mini">🏳️ {{ $t('online.truce', { n: pl.truceTurnsLeft }) }}</p>
        </template>
        <div class="actions"><button class="btn-ghost" @click="sheet = null; seatInfo = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>
    <div v-if="sheet === 'notes'" class="sheet-backdrop" @click.self="sheet = null">
      <div class="sheet">
        <h3>🔎 {{ $t('online.secret') }}</h3>
        <p class="mini center-t">{{ $t('online.secretHint') }}</p>
        <ul class="notes"><li v-for="(n, i) in [...game.you.notes].reverse()" :key="i">{{ n }}</li></ul>
        <p v-if="!game.you.notes.length" class="empty">{{ $t('online.noNotes') }}</p>
        <div class="actions"><button class="btn-ghost" @click="sheet = null">{{ $t('online.close') }}</button></div>
      </div>
    </div>

    <!-- réaction à une attaque -->
    <div v-if="reactionOpen && pendingAttack" class="sheet-backdrop react">
      <div class="sheet">
        <h3>⚔️ {{ $t('online.underAttack') }}</h3>
        <p class="center-t"><strong>{{ nameOf(pendingAttack.attackerId) }}</strong> → {{ pendingAttack.card.name }}</p>
        <div class="center-t"><CardFace :card="pendingAttack.card" small /></div>
        <p class="timer-big" :class="{ urgent: (secondsLeft ?? 99) <= 5 }">⏳ {{ secondsLeft }}s</p>
        <div v-if="pendingAttack.yourBlockers.length" class="cards">
          <button v-for="c in pendingAttack.yourBlockers" :key="c.id" class="c" :disabled="busy" @click="emit('act', { type: 'react', defenseCardId: c.id })">
            <CardFace :card="c" />
          </button>
        </div>
        <div class="actions col">
          <button v-if="pendingAttack.youCanDodge" class="btn-gold" :disabled="busy" @click="emit('act', { type: 'react', dodge: true })">🚢 {{ $t('online.dodge') }}</button>
          <button class="btn-danger" :disabled="busy" @click="emit('act', { type: 'react' })">🛡 {{ $t('online.takeHit') }}</button>
        </div>
      </div>
    </div>

    <!-- Jonque -->
    <div v-if="pendingScry" class="sheet-backdrop react">
      <div class="sheet">
        <h3>🔭 {{ $t('online.scryTitle') }}</h3>
        <div class="center-t" v-if="pendingScry.topCard"><CardFace :card="pendingScry.topCard" /></div>
        <div class="actions">
          <button class="btn-gold" :disabled="busy" @click="emit('act', { type: 'scry', keep: true })">{{ $t('online.scryKeep') }}</button>
          <button class="btn-ghost" :disabled="busy" @click="emit('act', { type: 'scry', keep: false })">{{ $t('online.scryBottom') }}</button>
        </div>
      </div>
    </div>

    <!-- révélation privée du rôle -->
    <div v-if="roleGate && !finished && myRole" class="sheet-backdrop role-gate">
      <div class="sheet info">
        <h3>🎭 {{ $t('online.roleGateTitle') }}</h3>
        <p class="center-t">{{ $t('online.roleGateText') }}</p>
        <button
          class="role-card" :class="{ held: roleHeld }"
          @pointerdown.prevent="roleHeld = true" @pointerup="roleHeld = false" @pointerleave="roleHeld = false" @pointercancel="roleHeld = false"
        >
          <template v-if="roleHeld">
            <img :src="myRole.catImage" :alt="myRole.catName" class="cat" />
            <strong>{{ $t('roles.' + myRole.id + '.name') }}</strong>
            <span>{{ $t('roles.' + myRole.id + '.mission') }}</span>
          </template>
          <span v-else class="hold">👁 {{ $t('online.holdToSee') }}</span>
        </button>
        <div class="actions"><button class="btn-gold" @click="closeRoleGate">{{ $t('online.understood') }}</button></div>
      </div>
    </div>

    <!-- fin de partie -->
    <div v-if="finished" class="sheet-backdrop over">
      <div class="sheet info">
        <h3>{{ game.winnerIds.length ? (iWon ? '🏆 ' + $t('online.victory') : '☠️ ' + $t('online.defeat')) : $t('online.draw') }}</h3>
        <p v-if="game.winnerIds.length" class="center-t">{{ $t('online.winners', { names: winnerNames }) }}</p>
        <p class="center-t mini">{{ mainLog }}</p>
        <ul class="final-roles">
          <li v-for="p in game.players" :key="p.id" :class="{ win: game.winnerIds.includes(p.id) }">
            <img :src="shipOf(p.shipId)!.image" alt="" />
            <span class="rn">{{ p.name }}</span>
            <span class="rr">{{ p.roleId ? $t('roles.' + p.roleId + '.name') : '' }}</span>
          </li>
        </ul>
        <div class="actions col">
          <button v-if="!spectator" class="btn-gold" :disabled="busy" @click="emit('rematch')">🔁 {{ $t('online.rematch') }}</button>
          <button class="btn-ghost" @click="emit('leave')">{{ $t('online.backToMenu') }}</button>
        </div>
        <p v-if="!spectator" class="mini center-t">{{ $t('online.rematchHint') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table { min-height: 100dvh; display: flex; flex-direction: column; gap: 8px; padding: 8px 10px calc(12px + env(safe-area-inset-bottom)); max-width: 980px; margin: 0 auto; transition: box-shadow .2s; }
.table.hurt { box-shadow: inset 0 0 0 4px rgba(255, 70, 60, .8), inset 0 0 60px rgba(255, 70, 60, .45); }
.topbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.chip { background: rgba(26, 15, 16, .6); color: var(--color-text-light); border: 1px solid rgba(200, 162, 74, .5); border-radius: 999px; padding: 6px 12px; font-size: .9rem; cursor: pointer; min-height: 36px; }
.chip.wide { width: 100%; text-align: left; }
.chip.ping { border-color: var(--color-gold); box-shadow: 0 0 10px rgba(200, 162, 74, .7); }
.event { order: 5; flex: 1 1 100%; min-width: 0; padding: 4px 10px; border-radius: 12px; background: rgba(58, 170, 176, .18); border: 1px solid rgba(58, 170, 176, .55); font-size: .78rem; line-height: 1.2; animation: pop .5s ease; }
.event strong { display: block; font-family: var(--font-display); font-size: 1rem; color: var(--color-turquoise); }
.timer { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(0, 0, 0, .35); }
.timer.urgent, .timer-big.urgent { color: #ff7268; animation: pulse .8s infinite; }
.net { font-size: .7rem; color: #d18a3a; }
.net.up { color: #59d17a; }
.opponents { display: flex; gap: 8px; overflow-x: auto; padding: 6px 2px 10px; scroll-snap-type: x proximity; }
.seat-btn { background: none; border: 0; padding: 0; cursor: pointer; scroll-snap-align: center; }
.center { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; position: relative; }
.piles { display: flex; gap: 10px; align-items: center; }
.pile { display: flex; flex-direction: column; align-items: center; min-width: 64px; padding: 8px; border-radius: 10px; background: rgba(0, 0, 0, .3); border: 1px dashed rgba(200, 162, 74, .5); }
.pile-n { font-family: var(--font-display); font-size: 1.6rem; }
.pile-l { font-size: .62rem; color: var(--color-text-muted); text-transform: uppercase; }
.log-mini { text-align: left; background: rgba(0, 0, 0, .28); border: 0; border-radius: 12px; padding: 8px 10px; color: var(--color-text-muted); cursor: pointer; min-height: 72px; }
.log-mini p { margin: 0; font-size: .78rem; line-height: 1.3; }
.log-mini p.latest { color: var(--color-text-light); font-weight: 600; }
.bubbles { position: absolute; right: 0; top: -34px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; pointer-events: none; }
.bubble { background: var(--color-cream); color: var(--color-ink); padding: 3px 10px; border-radius: 14px; font-size: .82rem; box-shadow: 0 3px 8px rgba(0, 0, 0, .4); }
.bubble-enter-active, .bubble-leave-active { transition: all .3s; }
.bubble-enter-from, .bubble-leave-to { opacity: 0; transform: translateY(8px); }
.hint { text-align: center; margin: 2px 0; color: var(--color-text-muted); font-size: .95rem; }
.hint.mine { color: var(--color-gold); font-family: var(--font-display); font-size: 1.3rem; animation: pulse 1.6s infinite; }
.mine { position: relative; margin-top: auto; padding: 10px; border-radius: 18px; background: rgba(26, 15, 16, .55); border: 1px solid rgba(200, 162, 74, .3); }
.mine.dead { opacity: .7; }
.mine-head { display: flex; gap: 12px; align-items: flex-start; }
.mine-seat { flex: 0 0 auto; }
.mine-side { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.mini { font-size: .78rem; color: var(--color-text-muted); margin: 2px 0; }
.center-t { text-align: center; }
.resources { display: flex; gap: 10px; margin: 14px 0 6px; flex-wrap: wrap; justify-content: center; }
.btn-gold.big { flex: 1 1 160px; padding: 16px 12px; font-size: 1.3rem; }
.hand { margin-top: 18px; overflow-x: auto; padding: 22px 6px 8px; }
.hand-row { display: flex; gap: 8px; width: max-content; margin: 0 auto; }
.hand-card { background: none; border: 0; padding: 0; cursor: pointer; }
.hand-card.locked { cursor: default; }
.hand-card:hover:not(.locked) :deep(.card-face:not(.selected)) { transform: translateY(-6px); }
.card-enter-active, .card-leave-active { transition: all .3s; }
.card-enter-from { opacity: 0; transform: translateY(40px) scale(.8); }
.card-leave-to { opacity: 0; transform: translateY(-30px) scale(.8); }
.card-move { transition: transform .3s; }
.empty { text-align: center; color: var(--color-text-muted); }
.mine .actions { position: sticky; bottom: 0; z-index: 5; padding: 8px 4px calc(6px + env(safe-area-inset-bottom)); margin: 8px -10px -10px; border-radius: 0 0 18px 18px; background: linear-gradient(180deg, rgba(26, 15, 16, 0), rgba(26, 15, 16, .96) 22%); }
.actions { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.actions.col { align-items: stretch; }
.actions .row { display: flex; gap: 8px; flex-wrap: wrap; }
.actions .row > * { flex: 1 1 100px; }
.sheet .actions { flex-direction: row; justify-content: center; margin-top: 14px; }
.sheet .actions.col { flex-direction: column; }
.badge { margin-left: 4px; padding: 0 6px; border-radius: 999px; background: #d1584f; color: #fff; font-size: .72rem; }
.resources .full { flex: 1 1 100%; margin: 0; }
.chat-fab { position: absolute; right: 10px; top: -22px; width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--color-gold); background: var(--color-burgundy); font-size: 1.3rem; cursor: pointer; }
.shop { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.shop li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; border-radius: 12px; background: rgba(0, 0, 0, .25); }
.shop small { display: block; color: var(--color-text-muted); font-size: .78rem; }
.log-full, .notes { max-height: 55vh; overflow: auto; padding-left: 18px; font-size: .88rem; }
.log-full li { margin: 3px 0; color: var(--color-text-muted); }
.log-full li:first-child { color: var(--color-text-light); font-weight: 600; }
.notes { list-style: none; padding: 0; }
.notes li { padding: 8px 10px; margin: 6px 0; border-radius: 10px; background: rgba(200, 162, 74, .14); border-left: 3px solid var(--color-gold); }
.chat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
.chat-btn { padding: 10px 6px; border-radius: 12px; border: 1px solid rgba(200, 162, 74, .5); background: rgba(0, 0, 0, .25); color: var(--color-text-light); font-size: .85rem; cursor: pointer; min-height: 48px; }
.chat-btn.emoji { font-size: 1.6rem; }
.chat-btn:hover { background: rgba(200, 162, 74, .25); }
.info { text-align: center; }
.cat, .ship-big { max-height: 150px; margin: 6px auto; display: block; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, .5)); }
.equip { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.equip h4 { width: 100%; margin: 6px 0 0; }
.timer-big { text-align: center; font-size: 1.5rem; font-weight: 700; margin: 6px 0; }
.cards { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 8px 0; }
.cards .c { background: none; border: 0; padding: 0; cursor: pointer; }
.role-card { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; min-height: 210px; justify-content: center; margin-top: 10px; padding: 14px; border-radius: 16px; border: 2px dashed var(--color-gold); background: rgba(0, 0, 0, .3); color: var(--color-text-light); cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; }
.role-card.held { background: var(--color-cream); color: var(--color-ink); border-style: solid; }
.role-card span { font-size: .85rem; }
.role-card .hold { font-size: 1.1rem; color: var(--color-gold); }
.final-roles { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 6px; }
.final-roles li { display: grid; grid-template-columns: 44px 1fr auto; gap: 8px; align-items: center; padding: 4px 10px; border-radius: 10px; background: rgba(0, 0, 0, .25); text-align: left; }
.final-roles li.win { background: rgba(200, 162, 74, .25); outline: 1px solid var(--color-gold); }
.final-roles img { max-height: 32px; max-width: 44px; object-fit: contain; }
.rr { color: var(--color-gold); font-size: .85rem; }
.sheet-backdrop.over, .sheet-backdrop.role-gate { z-index: 80; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
@keyframes pop { from { transform: scale(.94); opacity: 0; } to { transform: none; opacity: 1; } }
</style>
