<template>
  <div class="qty">
    <button class="qty-btn" :disabled="modelValue <= min" @click="dec" aria-label="Diminuer">−</button>
    <input
      type="number"
      class="qty-input"
      :value="modelValue"
      :min="min"
      :max="max"
      @input="onInput"
      @blur="onBlur"
    />
    <button class="qty-btn" :disabled="modelValue >= max" @click="inc" aria-label="Augmenter">+</button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
}>(), {
  min: 0,
  max: 99
})

const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function clamp(v: number) {
  return Math.max(props.min, Math.min(props.max, Math.floor(v)))
}

function inc() { emit('update:modelValue', clamp(props.modelValue + 1)) }
function dec() { emit('update:modelValue', clamp(props.modelValue - 1)) }

function onInput(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value, 10)
  if (Number.isFinite(v)) emit('update:modelValue', clamp(v))
}
function onBlur(e: Event) {
  const el = e.target as HTMLInputElement
  if (el.value === '' || !Number.isFinite(parseInt(el.value, 10))) {
    emit('update:modelValue', props.min)
    el.value = String(props.min)
  }
}
</script>

<style scoped>
.qty {
  display: inline-flex;
  align-items: stretch;
  border: 2px solid var(--color-gold-dark);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-burgundy-dark);
}
.qty-btn {
  width: 36px;
  background: transparent;
  border: none;
  color: var(--color-gold);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.qty-btn:hover:not(:disabled) {
  background: var(--color-gold);
  color: var(--color-burgundy-dark);
}
.qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.qty-input {
  width: 44px;
  background: transparent;
  border: none;
  border-left: 1px solid var(--color-gold-dark);
  border-right: 1px solid var(--color-gold-dark);
  color: var(--color-text-light);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-input:focus { outline: none; }
</style>
