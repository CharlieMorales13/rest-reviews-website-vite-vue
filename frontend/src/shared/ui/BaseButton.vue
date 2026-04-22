<script setup lang="ts">
import Spinner from './Spinner.vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  shape?: 'pill' | 'rounded'
  loading?: boolean
  loadingText?: string
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  /** 'dark' = ghost has white/10 tones; 'light' = ghost has black/5 tones */
  theme?: 'dark' | 'light'
}>(), {
  variant: 'primary',
  size: 'md',
  shape: 'pill',
  loading: false,
  block: false,
  disabled: false,
  type: 'button',
  theme: 'dark',
})

const sizeMap: Record<string, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
}

const shapeMap: Record<string, string> = {
  pill:    'rounded-full',
  rounded: 'rounded-xl',
}

const variantMap: Record<string, Record<string, string>> = {
  primary: {
    dark:  'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-md hover:shadow-lg hover:shadow-orange-500/20',
    light: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-md hover:shadow-lg hover:shadow-orange-500/20',
  },
  ghost: {
    dark:  'text-white/50 hover:text-white hover:bg-white/10',
    light: 'text-[#525155] hover:text-[#0e0e10] hover:bg-black/5',
  },
  danger: {
    dark:  'bg-red-500 hover:bg-red-400 text-white',
    light: 'bg-red-500 hover:bg-red-400 text-white',
  },
  outline: {
    dark:  'border border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-white',
    light: 'border border-orange-500/40 text-orange-500 hover:bg-orange-500 hover:text-white',
  },
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      sizeMap[props.size],
      shapeMap[props.shape],
      variantMap[props.variant]?.[props.theme] ?? '',
      block ? 'w-full' : '',
    ]"
  >
    <Spinner v-if="loading" size="xs" :variant="props.variant === 'ghost' && props.theme === 'light' ? 'dark' : 'white'" />
    <slot />
    <template v-if="loading && loadingText">{{ loadingText }}</template>
  </button>
</template>
