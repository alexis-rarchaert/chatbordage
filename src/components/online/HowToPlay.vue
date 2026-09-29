<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'close'): void }>()
const steps = ['goal', 'turn', 'attack', 'roles', 'shop', 'tips']
const i = ref(0)
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true">
      <h3>{{ $t('online.tuto.' + steps[i] + '.title') }}</h3>
      <p class="body" v-html="$t('online.tuto.' + steps[i] + '.text')"></p>
      <div class="dots"><span v-for="(_, k) in steps" :key="k" :class="{ on: k === i }"></span></div>
      <div class="nav">
        <button class="btn-ghost" :disabled="i === 0" @click="i--">◀</button>
        <button v-if="i < steps.length - 1" class="btn-gold" @click="i++">{{ $t('online.next') }}</button>
        <button v-else class="btn-gold" @click="emit('close')">{{ $t('online.letsGo') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.body { line-height: 1.5; font-size: 1.02rem; }
.dots { display: flex; gap: 6px; justify-content: center; margin: 12px 0; }
.dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, .25); }
.dots span.on { background: var(--color-gold); }
.nav { display: flex; gap: 10px; justify-content: center; }
</style>
