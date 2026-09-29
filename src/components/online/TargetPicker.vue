<script setup lang="ts">
import { ref } from 'vue'
import type { PublicPlayer } from '../../game'
import PlayerSeat from './PlayerSeat.vue'

const props = defineProps<{ title: string; players: PublicPlayer[]; max?: number }>()
const emit = defineEmits<{ (e: 'pick', ids: string[]): void; (e: 'cancel'): void }>()

const chosen = ref<string[]>([])
const max = props.max ?? 1

function toggle(id: string) {
  if (max === 1) return emit('pick', [id])
  const i = chosen.value.indexOf(id)
  if (i !== -1) chosen.value.splice(i, 1)
  else if (chosen.value.length < max) chosen.value.push(id)
}
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('cancel')">
    <div class="sheet" role="dialog" aria-modal="true">
      <h3>{{ title }}</h3>
      <div class="grid">
        <button v-for="p in players" :key="p.id" class="pick" :class="{ on: chosen.includes(p.id) }" @click="toggle(p.id)">
          <PlayerSeat :player="p" />
        </button>
      </div>
      <p v-if="!players.length" class="empty">{{ $t('online.noTarget') }}</p>
      <div class="actions">
        <button class="btn-ghost" @click="emit('cancel')">{{ $t('online.cancel') }}</button>
        <button v-if="max > 1" class="btn-gold" :disabled="!chosen.length" @click="emit('pick', chosen)">
          {{ $t('online.confirmTargets', { n: chosen.length, max }) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 12px 0; }
.pick { background: none; border: 0; padding: 0; cursor: pointer; border-radius: 16px; }
.pick.on :deep(.seat) { border-color: var(--color-gold); box-shadow: 0 0 0 3px var(--color-gold); }
.pick:hover :deep(.seat) { border-color: var(--color-turquoise); }
.empty { text-align: center; color: var(--color-text-muted); }
.actions { display: flex; gap: 10px; justify-content: center; }
</style>
