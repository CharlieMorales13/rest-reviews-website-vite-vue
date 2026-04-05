<script setup lang="ts">
import { ref, watch } from 'vue';
import { httpClient } from '@/shared/api/httpClient';

const props = defineProps<{
  isOpen: boolean;
  review?: { id: string; author?: string; comment?: string; foodScore?: number } | null;
}>();

const emit = defineEmits<{
  close: [];
  sent: [payload: { reviewId: string; reply: string }];
}>();

const replyText = ref('');
const isSubmitting = ref(false);
const error = ref<string | null>(null);

watch(() => props.isOpen, (open) => {
  if (!open) {
    replyText.value = '';
    error.value = null;
  }
});

const handleClose = () => {
  emit('close');
};

const handleReply = async () => {
  if (!replyText.value.trim() || !props.review || isSubmitting.value) return;
  isSubmitting.value = true;
  error.value = null;
  try {
    await httpClient.patch(`/api/reviews/${props.review.id}/reply`, { reply: replyText.value.trim() });
    emit('sent', { reviewId: props.review.id, reply: replyText.value.trim() });
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al publicar la respuesta.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in px-4">
    <div class="absolute inset-0 bg-[#0e0e10]/80 backdrop-blur-xl" @click="handleClose"></div>

    <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-black/5 bg-[#FAF9F6] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
            <span class="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-[#0e0e10] leading-tight brand">Respuesta Oficial</h3>
            <p class="text-xs text-[#525155] font-medium">
              Contestando a: <span class="font-bold text-orange-500">{{ review?.author || 'Estudiante' }}</span>
            </p>
          </div>
        </div>
        <button @click="handleClose" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 text-[#adaaad] transition-colors group">
          <span class="material-symbols-outlined text-xl group-hover:text-black">close</span>
        </button>
      </div>

      <div class="p-8 flex flex-col gap-6">
        <!-- Original Review -->
        <div class="p-5 rounded-2xl bg-[#FAF9F6] relative border border-black/5">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-2xl"></div>
          <div class="flex items-center gap-1 mb-2 text-orange-500">
            <span
              v-for="i in 5"
              :key="i"
              class="material-symbols-outlined text-sm"
              :style="{ fontVariationSettings: `'FILL' ${i <= Math.round(review?.foodScore ?? 5) ? 1 : 0}` }"
            >star</span>
          </div>
          <p class="text-[#3f3f42] text-sm italic">"{{ review?.comment || 'Sin contenido.' }}"</p>
        </div>

        <!-- Reply Input -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-orange-500 uppercase tracking-widest pl-1">Tu Respuesta</label>
          <textarea
            v-model="replyText"
            rows="5"
            class="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-5 py-4 text-[#0e0e10] font-sans placeholder-black/30 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
            placeholder="Escribe una respuesta profesional y cortés representando tu establecimiento..."
          ></textarea>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
          <span class="material-symbols-outlined text-sm">error</span>
          {{ error }}
        </div>
      </div>

      <!-- Actions -->
      <div class="px-8 py-5 border-t border-black/5 bg-[#FAF9F6] flex items-center justify-end gap-3">
        <button @click="handleClose" class="px-6 py-2.5 rounded-full text-sm font-semibold text-[#525155] hover:text-[#0e0e10] hover:bg-black/5 transition-colors">
          Cancelar
        </button>
        <button
          @click="handleReply"
          :disabled="isSubmitting || !replyText.trim()"
          class="px-8 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
        >
          <span v-if="isSubmitting" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          {{ isSubmitting ? 'Publicando...' : 'Publicar Respuesta' }}
        </button>
      </div>
    </div>
  </div>
</template>
