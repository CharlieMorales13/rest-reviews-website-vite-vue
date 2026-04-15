<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  images: string[];
  initialIndex?: number;
}>(), {
  initialIndex: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const current = ref(props.initialIndex);

watch(() => props.modelValue, (open) => {
  if (open) {
    current.value = props.initialIndex;
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const close = () => emit('update:modelValue', false);
const prev = () => { if (current.value > 0) current.value--; };
const next = () => { if (current.value < props.images.length - 1) current.value++; };

const onKey = (e: KeyboardEvent) => {
  if (!props.modelValue) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
};

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
        @click.self="close"
      >
        <!-- Close -->
        <button
          @click="close"
          class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <span class="material-symbols-outlined">close</span>
        </button>

        <!-- Prev -->
        <button
          v-if="images.length > 1 && current > 0"
          @click="prev"
          class="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <span class="material-symbols-outlined">arrow_back_ios</span>
        </button>

        <!-- Image -->
        <img
          :src="images[current]"
          class="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl select-none"
        />

        <!-- Next -->
        <button
          v-if="images.length > 1 && current < images.length - 1"
          @click="next"
          class="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <span class="material-symbols-outlined">arrow_forward_ios</span>
        </button>

        <!-- Counter -->
        <div v-if="images.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold font-headline">
          {{ current + 1 }} / {{ images.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-enter-active, .lb-leave-active { transition: opacity 0.2s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }
</style>
