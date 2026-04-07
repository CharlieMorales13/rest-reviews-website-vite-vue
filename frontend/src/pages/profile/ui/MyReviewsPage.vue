<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { MyReview } from '@/entities/review/model/types';

const reviews = ref<MyReview[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    reviews.value = await ReviewService.getMyReviews();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudieron cargar tus reseñas.';
  } finally {
    loading.value = false;
  }
});

const computeIGE = (food: number, service: number, price: number) => {
  return ((food * 0.5 + service * 0.3 + price * 0.2)).toFixed(1);
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

    <!-- Header con CTA -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
      <div>
        <h2 class="text-3xl font-extrabold text-white">Mis Reseñas</h2>
        <p class="text-white/50 mt-1">Tus evaluaciones y respuestas de los gerentes.</p>
      </div>
      <RouterLink
        to="/establishments"
        class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-base px-7 py-4 rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 whitespace-nowrap"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
        Evaluar ahora
      </RouterLink>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 2" :key="i" class="rounded-3xl bg-white/5 animate-pulse h-40"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center text-red-400 py-12">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="reviews.length === 0" class="rounded-3xl p-14 text-center border border-white/10 bg-white/3">
      <span class="material-symbols-outlined text-5xl text-white/20 mb-4 block">rate_review</span>
      <p class="text-white/50 font-medium mb-6">Aún no has escrito ninguna reseña.</p>
      <RouterLink
        to="/establishments"
        class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-base px-8 py-4 rounded-2xl shadow-lg hover:shadow-orange-500/30 transition-all"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
        Evaluar ahora
      </RouterLink>
    </div>

    <div v-else class="space-y-6">
      <div v-for="rev in reviews" :key="rev.id" class="glass-effect p-6 md:p-8 rounded-3xl shadow-lg border border-white/10 bg-[#12161D] transition-transform hover:-translate-y-1">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 class="text-xl font-bold text-white">{{ rev.establishmentName || 'Establecimiento' }}</h3>
            <p class="text-white/40 text-xs mt-1">{{ formatDate(rev.createdAt) }}</p>
          </div>

          <div class="flex gap-2.5">
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border border-white/5 w-16">
              <span class="text-white font-bold">{{ rev.foodScore }}</span>
              <span class="text-[9px] uppercase text-white/50 font-semibold tracking-wider">Comida</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border border-white/5 w-16">
              <span class="text-white font-bold">{{ rev.serviceScore }}</span>
              <span class="text-[9px] uppercase text-white/50 font-semibold tracking-wider">Servicio</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 w-16 shadow-[0_0_10px_rgba(255,121,0,0.1)]">
              <span class="text-orange-500 font-bold">{{ computeIGE(rev.foodScore, rev.serviceScore, rev.priceScore) }}</span>
              <span class="text-[9px] uppercase text-orange-500 font-semibold tracking-wider">IGE</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div v-if="rev.comment" class="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
          <p class="text-white/80 leading-relaxed text-sm md:text-base">"{{ rev.comment }}"</p>
        </div>

        <!-- Manager Reply -->
        <div v-if="rev.managerReply" class="mt-4 p-5 rounded-2xl bg-[#FAF9F6] border border-orange-500/30 shadow-inner relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-orange-500 text-base">reply</span>
            <span class="text-xs font-extrabold text-orange-500 uppercase tracking-wider">Respuesta del Gerente</span>
          </div>
          <p class="text-sm text-[#333] leading-relaxed ml-7">{{ rev.managerReply }}</p>
        </div>

      </div>
    </div>
  </div>
</template>
