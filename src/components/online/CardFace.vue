<script setup lang="ts">
import type { Card } from '../../game'
import { FAMILY_META } from '../../lib/gameLabels'

defineProps<{ card: Card; selected?: boolean; disabled?: boolean; small?: boolean }>()
</script>

<template>
  <div
    class="card-face"
    :class="[`rarity-${card.rarity}`, { selected, disabled, small }]"
    :style="{ '--fam': FAMILY_META[card.family].color }"
  >
    <div class="card-top">
      <span class="card-icon" aria-hidden="true">{{ FAMILY_META[card.family].icon }}</span>
      <span class="card-family">{{ $t('online.family.' + FAMILY_META[card.family].key) }}</span>
    </div>
    <div class="card-name">{{ card.name }}</div>
    <div v-if="!small" class="card-desc">{{ card.description }}</div>
    <div v-if="card.damage && card.family === 'ABORDAGE'" class="card-badge">−{{ card.damage }} ❤</div>
    <div v-else-if="card.heal" class="card-badge heal">+{{ card.heal }} ❤</div>
    <div v-if="card.permanent" class="card-perm">{{ $t('online.permanent') }}</div>
  </div>
</template>

<style scoped>
.card-face {
  --fam: #888;
  position: relative;
  width: 112px;
  min-height: 156px;
  padding: 8px 8px 10px;
  border-radius: 12px;
  color: var(--color-ink);
  background: linear-gradient(180deg, #fbf1dc, var(--color-cream));
  border: 3px solid var(--fam);
  box-shadow: 0 6px 14px rgba(0, 0, 0, .35);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  transition: transform .18s ease, box-shadow .18s ease;
  user-select: none;
}
.card-face.small { width: 92px; min-height: 64px; }
.card-face.rarity-rare { box-shadow: 0 0 0 2px rgba(58, 170, 176, .5), 0 6px 14px rgba(0, 0, 0, .35); }
.card-face.rarity-epique { box-shadow: 0 0 0 2px rgba(200, 162, 74, .9), 0 0 14px rgba(200, 162, 74, .55), 0 6px 14px rgba(0, 0, 0, .35); }
.card-face.selected { transform: translateY(-14px) scale(1.05); box-shadow: 0 0 0 3px var(--color-gold), 0 12px 22px rgba(0, 0, 0, .5); }
.card-face.disabled { filter: grayscale(.6) brightness(.8); }
.card-top { display: flex; align-items: center; gap: 4px; font-size: .62rem; text-transform: uppercase; letter-spacing: .05em; color: var(--fam); font-weight: 700; }
.card-icon { font-size: 1rem; }
.card-name { font-family: var(--font-display); font-size: 1.05rem; line-height: 1.05; }
.card-desc { font-size: .68rem; line-height: 1.2; color: #3a2a2b; }
.card-badge { position: absolute; right: 6px; bottom: 6px; background: var(--fam); color: #fff; font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 999px; }
.card-badge.heal { background: #3f8f5b; }
.card-face.small .card-badge { position: static; align-self: flex-start; }
.card-perm { position: absolute; left: 6px; bottom: 6px; font-size: .58rem; font-weight: 700; text-transform: uppercase; color: var(--color-gold-dark); }
</style>
