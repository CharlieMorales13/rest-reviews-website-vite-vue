<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  /** 'dark' = bg-[#1f1f22]; 'light' = bg-white */
  theme?: 'dark' | 'light'
}>(), {
  size: 'md',
  closable: true,
  theme: 'dark',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

function trapFocus(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closable) { close(); return }
  if (event.key !== 'Tab') return
  const focusable = panelRef.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey) {
    if (document.activeElement === first) { last.focus(); event.preventDefault() }
  } else {
    if (document.activeElement === last) { first.focus(); event.preventDefault() }
  }
}

watch(() => props.modelValue, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    previousFocus = document.activeElement as HTMLElement
    document.addEventListener('keydown', trapFocus)
    await nextTick()
    const first = panelRef.value?.querySelector<HTMLElement>(
      'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )
    first?.focus()
  } else {
    document.removeEventListener('keydown', trapFocus)
    previousFocus?.focus()
  }
}, { immediate: false })

const sizeMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const themeMap: Record<string, string> = {
  dark:  'bg-[#1a1a1d] border border-white/10 text-white',
  light: 'bg-white border border-black/5 text-[#0e0e10]',
}

const headerThemeMap: Record<string, string> = {
  dark:  'border-white/8',
  light: 'border-black/5 bg-[#FAF9F6]',
}

const footerThemeMap: Record<string, string> = {
  dark:  'border-white/8',
  light: 'border-black/5 bg-[#FAF9F6]',
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[200] flex items-center justify-center px-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-[#0e0e10]/80 backdrop-blur-xl"
          @click="closable && close()"
        />

        <!-- Panel -->
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          leave-active-class="transition-all duration-150"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="modelValue"
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'modal-title' : undefined"
            class="relative w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            :class="[sizeMap[props.size], themeMap[props.theme]]"
          >
            <!-- Header slot or default title -->
            <div
              v-if="$slots.header || title"
              class="px-8 py-5 border-b flex items-center justify-between"
              :class="headerThemeMap[props.theme]"
            >
              <slot name="header">
                <h3 id="modal-title" class="text-lg font-bold leading-tight brand">{{ title }}</h3>
              </slot>
              <button
                v-if="closable"
                @click="close"
                aria-label="Cerrar"
                class="w-9 h-9 rounded-full flex items-center justify-center transition-colors ml-4 flex-shrink-0"
                :class="props.theme === 'dark' ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/5 text-[#adaaad] hover:text-black'"
              >
                <Icon name="close" size="20" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-8 flex-1 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="px-8 py-5 border-t"
              :class="footerThemeMap[props.theme]"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
