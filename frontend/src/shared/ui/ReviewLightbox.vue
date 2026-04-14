<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

export interface LightboxItem {
  url: string;
  comment: string | null;
  author: string | null;
}

const props = withDefaults(defineProps<{
  modelValue: boolean;
  items: LightboxItem[];
  initialIndex?: number;
}>(), {
  initialIndex: 0
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const currentIndex = ref(props.initialIndex);

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    currentIndex.value = props.initialIndex;
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const closeLightbox = () => {
  emit('update:modelValue', false);
};

const prevImage = () => {
  if (props.items.length === 0) return;
  currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length;
};

const nextImage = () => {
  if (props.items.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % props.items.length;
};

const onKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="modelValue && items.length > 0"
        class="fixed inset-0 z-[200] flex items-center justify-center"
        @click.self="closeLightbox"
      >
        <div class="absolute inset-0 bg-black/90 backdrop-blur-md" @click="closeLightbox"></div>

        <div class="relative z-10 w-full max-w-3xl mx-4 flex flex-col items-center gap-4">
          <button
            @click="closeLightbox"
            class="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10"
          >
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="relative w-full flex justify-center">
            <img
              :src="items[currentIndex]?.url"
              class="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/5 bg-black/50"
              alt="Evidencia de reseña"
            />
            
            <button
              v-if="items.length > 1"
              @click.stop="prevImage"
              class="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 shadow-xl"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              v-if="items.length > 1"
              @click.stop="nextImage"
              class="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 shadow-xl"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          <div class="w-full max-w-3xl bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-white border border-white/10 shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-black tracking-wide text-orange-400">
                {{ items[currentIndex]?.author || 'Estudiante' }}
              </span>
              <span v-if="items.length > 1" class="text-[10px] uppercase font-bold tracking-widest text-white/50 px-2 py-1 bg-black/30 rounded-full">
                {{ currentIndex + 1 }} / {{ items.length }}
              </span>
            </div>
            <p v-if="items[currentIndex]?.comment" class="text-sm text-white/80 leading-relaxed font-medium">
              {{ items[currentIndex]?.comment }}
            </p>
            <p v-else class="text-sm text-white/40 italic font-medium">Evidencia fotográfica</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-enter-active, .lb-leave-active { transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.lb-enter-from, .lb-leave-to { opacity: 0; }
</style>
