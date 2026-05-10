<script setup lang="ts">
withDefaults(defineProps<{
  value: number
  max?: number
  size?: number
  color?: string
}>(), {
  max: 5,
  size: 14,
  color: '#f97316',
})
</script>

<template>
  <div
    class="flex gap-px"
    role="img"
    :aria-label="`${value} de ${max} estrellas`"
  >
    <span
      v-for="n in max"
      :key="n"
      aria-hidden="true"
      class="material-symbols-outlined"
      :style="{
        fontSize: `${size}px`,
        color: color,
        fontVariationSettings: `'FILL' ${n <= value ? 1 : 0}`,
      }"
    >star</span>
  </div>
</template>
