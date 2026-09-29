<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { RoomChatMessage } from '../../game'

const props = defineProps<{ messages: RoomChatMessage[]; youId: string }>()
const emit = defineEmits<{ (e: 'send', text: string): void }>()

const text = ref('')
const list = ref<HTMLElement | null>(null)

function submit() {
  const t = text.value.trim()
  if (!t) return
  emit('send', t)
  text.value = ''
}

watch(() => props.messages.length, async () => {
  await nextTick()
  if (list.value) list.value.scrollTop = list.value.scrollHeight
}, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="room-chat">
    <ol ref="list" class="msgs" aria-live="polite">
      <li v-for="m in messages" :key="m.id" :class="{ mine: m.userId === youId }">
        <b>{{ m.name }}</b>
        <span>{{ m.text }}</span>
      </li>
      <li v-if="!messages.length" class="empty">{{ $t('online.chatEmpty') }}</li>
    </ol>
    <form class="compose" @submit.prevent="submit">
      <input v-model="text" maxlength="200" :placeholder="$t('online.chatPlaceholder')" autocomplete="off" enterkeyhint="send" />
      <button class="btn-gold" type="submit" :disabled="!text.trim()">➤</button>
    </form>
  </div>
</template>

<style scoped>
.room-chat { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.msgs { list-style: none; margin: 0; padding: 8px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 38vh; min-height: 90px; border-radius: 12px; background: rgba(0, 0, 0, .3); }
.msgs li { max-width: 88%; padding: 5px 10px; border-radius: 12px; background: rgba(245, 233, 212, .12); font-size: .9rem; line-height: 1.3; overflow-wrap: anywhere; align-self: flex-start; }
.msgs li.mine { align-self: flex-end; background: rgba(58, 170, 176, .28); }
.msgs li b { display: block; font-size: .72rem; color: var(--color-gold); }
.msgs li.empty { align-self: center; background: none; color: var(--color-text-muted); }
.compose { display: flex; gap: 8px; }
.compose input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 999px; border: 2px solid rgba(200, 162, 74, .5); background: rgba(0, 0, 0, .35); color: var(--color-text-light); font-size: 1rem; font-family: var(--font-body); }
.compose input:focus { outline: none; border-color: var(--color-gold); }
.compose .btn-gold { padding: 8px 16px; }
</style>
