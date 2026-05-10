<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  max?: number
  size?: number
  label?: string
}>(), {
  max: 5,
  size: 32,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hovered = ref(0)

const select = (n: number) => emit('update:modelValue', n)
const active = (n: number) => n <= (hovered.value || props.modelValue)
</script>

<template>
  <div>
    <p v-if="label" class="text-[10px] uppercase text-white/50 font-semibold tracking-widest mb-2">
      {{ label }}
    </p>
    <div class="flex gap-1" role="group" :aria-label="label || 'Calificación'">
      <button
        v-for="n in max"
        :key="n"
        type="button"
        @click="select(n)"
        @mouseenter="hovered = n"
        @mouseleave="hovered = 0"
        class="transition-transform hover:scale-110 active:scale-95"
        :aria-label="`${n} de ${max} estrellas`"
        :aria-pressed="n <= modelValue"
      >
        <span
          aria-hidden="true"
          class="material-symbols-outlined block"
          :style="{
            fontSize: `${size}px`,
            color: active(n) ? '#f97316' : 'rgba(255,255,255,0.2)',
            fontVariationSettings: `'FILL' ${active(n) ? 1 : 0}`,
            transition: 'color 0.15s, font-variation-settings 0.15s',
          }"
        >star</span>
      </button>
    </div>
  </div>
</template>
