<script setup lang="ts">
import { computed } from 'vue'
import type { PublicPlayer } from '../../game'
import { shipOf } from '../../lib/gameLabels'

const props = defineProps<{ player: PublicPlayer; active?: boolean; you?: boolean; attacked?: boolean; winner?: boolean }>()
const ship = computed(() => shipOf(props.player.shipId))
</script>

<template>
  <div class="seat" :class="{ active, you, dead: !player.isAlive, attacked, winner }">
    <div class="seat-ship">
      <img v-if="ship" :src="ship.image" :alt="ship.name" />
      <span v-if="player.roleId === 'capitaine'" class="crown" :title="$t('online.captain')">👑</span>
      <span v-if="!player.isAlive" class="skull">☠️</span>
    </div>
    <div class="seat-name">{{ player.name }}<span v-if="you"> ({{ $t('online.you') }})</span></div>
    <div v-if="!player.isAlive && player.roleId" class="seat-role">🎭 {{ $t('roles.' + player.roleId + '.name') }}</div>
    <div class="seat-hp" :aria-label="`${player.hp}/${player.maxHp} PV`">
      <span v-for="i in player.maxHp" :key="i" class="heart" :class="{ empty: i > player.hp }">❤</span>
    </div>
    <div class="seat-meta">
      <span title="pièces">🪙 {{ player.coins }}</span>
      <span title="cartes">🃏 {{ player.handCount }}</span>
      <span v-if="player.permanents.length" title="équipements">🛡 {{ player.permanents.length }}</span>
      <span v-if="player.truceTurnsLeft" title="trêve">🏳️</span>
    </div>
  </div>
</template>

<style scoped>
.seat {
  flex: 0 0 auto; width: 104px; padding: 6px 6px 8px; border-radius: 14px; text-align: center;
  background: rgba(26, 15, 16, .55); border: 2px solid rgba(200, 162, 74, .25);
  transition: transform .2s, border-color .2s, box-shadow .2s, opacity .3s;
}
.seat.active { border-color: var(--color-gold); box-shadow: 0 0 16px rgba(200, 162, 74, .6); transform: translateY(-2px); }
.seat.you { background: rgba(58, 170, 176, .18); }
.seat.dead { opacity: .45; filter: grayscale(1); }
.seat.attacked { animation: hit .6s ease; border-color: #ff5b4f; }
.seat.winner { border-color: var(--color-gold); box-shadow: 0 0 22px var(--color-gold); }
.seat-ship { position: relative; height: 52px; display: grid; place-items: center; }
.seat-ship img { max-height: 52px; max-width: 92px; object-fit: contain; filter: drop-shadow(0 3px 4px rgba(0, 0, 0, .5)); }
.crown { position: absolute; top: -8px; right: 2px; font-size: 1rem; }
.skull { position: absolute; font-size: 1.6rem; }
.seat-name { font-family: var(--font-display); font-size: .95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.seat-role { font-size: .68rem; color: var(--color-gold); line-height: 1.1; padding: 1px 0; }
.seat-hp { line-height: 1; font-size: .7rem; min-height: 14px; }
.heart { color: #ff5b6b; }
.heart.empty { color: rgba(255, 255, 255, .18); }
.seat-meta { display: flex; justify-content: center; gap: 6px; font-size: .72rem; color: var(--color-text-muted); flex-wrap: wrap; }
@keyframes hit { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
</style>
