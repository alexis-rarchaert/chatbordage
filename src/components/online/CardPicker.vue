<script setup lang="ts">
import { ref } from 'vue'
import type { Card } from '../../game'
import CardFace from './CardFace.vue'

const props = defineProps<{ title: string; cards: Card[]; count?: number; confirmLabel?: string }>()
const emit = defineEmits<{ (e: 'pick', ids: string[]): void; (e: 'cancel'): void }>()

const count = props.count ?? 1
const chosen = ref<string[]>([])

function toggle(id: string) {
  const i = chosen.value.indexOf(id)
  if (i !== -1) chosen.value.splice(i, 1)
  else if (chosen.value.length < count) chosen.value.push(id)
  else if (count === 1) chosen.value = [id]
}
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('cancel')">
    <div class="sheet" role="dialog" aria-modal="true">
      <h3>{{ title }}</h3>
      <div class="cards">
        <button v-for="c in cards" :key="c.id" class="c" @click="toggle(c.id)">
          <CardFace :card="c" :selected="chosen.includes(c.id)" small />
        </button>
      </div>
      <div class="actions">
        <button class="btn-ghost" @click="emit('cancel')">{{ $t('online.cancel') }}</button>
        <button class="btn-gold" :disabled="chosen.length !== count" @click="emit('pick', chosen)">
          {{ confirmLabel ?? $t('online.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin: 22px 0 14px; }
.c { background: none; border: 0; padding: 0; cursor: pointer; }
.actions { display: flex; gap: 10px; justify-content: center; }
</style>
