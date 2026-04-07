<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { Establishment, EstablishmentReview } from '@/entities/review/model/types';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const establishmentId = route.params.id as string;

const est = ref<Establishment | null>(null);
const reviews = ref<EstablishmentReview[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const heroImage = computed(() => est.value?.galleryUrls?.[0] || FALLBACK_IMG);
const avgFood = computed(() => reviews.value.length ? (reviews.value.reduce((s, r) => s + r.foodScore, 0) / reviews.value.length).toFixed(1) : '–');
const avgService = computed(() => reviews.value.length ? (reviews.value.reduce((s, r) => s + r.serviceScore, 0) / reviews.value.length).toFixed(1) : '–');
const ige = computed(() => {
  if (!reviews.value.length) return '–';
  const avgF = reviews.value.reduce((s, r) => s + r.foodScore, 0) / reviews.value.length;
  const avgS = reviews.value.reduce((s, r) => s + r.serviceScore, 0) / reviews.value.length;
  const avgP = reviews.value.reduce((s, r) => s + r.priceScore, 0) / reviews.value.length;
  return ((avgF * 0.5 + avgS * 0.3 + avgP * 0.2) * 20).toFixed(1);
});

onMounted(async () => {
  try {
    const [establishment, reviewsResult] = await Promise.all([
      ReviewService.getEstablishment(establishmentId),
      ReviewService.getEstablishmentReviews(establishmentId, 1, 50),
    ]);
    est.value = establishment;
    reviews.value = reviewsResult.data;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar el establecimiento.';
  } finally {
    loading.value = false;
  }
});

const goToReview = () => {
  router.push(`/review/create/${establishmentId}`);
};

const initials = (name: string | null) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
};
</script>

<template>
  <div class="w-full mx-auto animate-fade-in relative z-10">

    <!-- Error -->
    <div v-if="error" class="max-w-4xl mx-auto px-6 py-24 text-center text-red-400">
      <span class="material-symbols-outlined text-5xl mb-4 block">error</span>
      {{ error }}
    </div>

    <!-- Skeleton -->
    <div v-else-if="loading">
      <div class="w-full h-[50vh] min-h-[400px] bg-[#1a1a1d] animate-pulse"></div>
      <div class="max-w-4xl mx-auto px-6 mt-28 space-y-4">
        <div class="h-6 bg-white/10 rounded w-1/3 animate-pulse"></div>
        <div class="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>

    <template v-else-if="est">
      <!-- Hero Header -->
      <div class="relative w-full h-[50vh] min-h-[400px]">
        <div class="absolute inset-0 bg-[#0e0e10]/40 z-10"></div>
        <img :src="heroImage" class="absolute inset-0 w-full h-full object-cover" />

        <button @click="router.back()" class="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-[#0e0e10]/60 hover:bg-[#0e0e10]/80 backdrop-blur-md rounded-full text-white transition-colors border border-[#48474a]/30">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Regresar
        </button>

        <!-- Info Card -->
        <div class="absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-4xl card-cream p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-black/5">
          <div>
            <span class="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold uppercase rounded-full border border-orange-500/20 tracking-wider">
              {{ est.category }}
            </span>
            <h2 class="text-4xl font-extrabold text-[#0e0e10] mt-3 brand">{{ est.name }}</h2>
            <p v-if="est.openingHours" class="text-[#525155] flex items-center gap-2 mt-2 font-medium">
              <span class="material-symbols-outlined text-sm">schedule</span>
              Abierto: {{ est.openingHours }}
            </p>
          </div>

          <div class="flex gap-4">
            <div class="flex flex-col items-center p-3 bg-white rounded-xl border border-black/5 shadow-sm min-w-20">
              <span class="text-xl font-bold text-[#0e0e10]">{{ avgFood }}</span>
              <span class="text-[10px] text-[#adaaad] uppercase font-bold tracking-widest">Comida</span>
            </div>
            <div class="flex flex-col items-center p-3 bg-white rounded-xl border border-black/5 shadow-sm min-w-20">
              <span class="text-xl font-bold text-[#0e0e10]">{{ avgService }}</span>
              <span class="text-[10px] text-[#adaaad] uppercase font-bold tracking-widest">Servicio</span>
            </div>
            <div class="flex flex-col items-center p-3 rounded-xl border border-orange-500/20 bg-orange-500/10 min-w-24 shadow-sm">
              <span class="text-2xl font-black text-orange-500">{{ ige }}</span>
              <span class="text-[10px] text-orange-500 uppercase font-bold tracking-widest">IGE Total</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-4xl mx-auto px-6 mt-28 mb-16 space-y-12">

        <!-- CTA -->
        <div v-if="authStore.user?.role === 'student'" class="flex justify-center my-8">
          <button
            @click="goToReview"
            class="w-full md:w-2/3 py-5 text-xl tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined font-bold">edit_square</span>
            Escribir una Reseña
          </button>
        </div>

        <!-- Galería -->
        <section v-if="est.galleryUrls && est.galleryUrls.length > 0">
          <h3 class="text-2xl font-bold text-white mb-6 brand">Galería del Establecimiento</h3>
          <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
            <div v-for="(img, idx) in est.galleryUrls" :key="'g'+idx" class="shrink-0 w-72 h-48 rounded-2xl overflow-hidden snap-center border border-[#48474a]/15 shadow-lg">
              <img :src="img" class="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer" />
            </div>
          </div>
        </section>

        <!-- Menú -->
        <section v-if="est.menuUrls && est.menuUrls.length > 0">
          <h3 class="text-2xl font-bold text-white mb-6 brand">Menú y Carta</h3>
          <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
            <div v-for="(img, idx) in est.menuUrls" :key="'m'+idx" class="shrink-0 w-64 h-80 rounded-2xl overflow-hidden snap-center border border-[#48474a]/15 shadow-lg bg-surface-container-high relative group">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
              </div>
              <img :src="img" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer z-0 relative" />
            </div>
          </div>
        </section>

        <!-- Reviews -->
        <section>
          <h3 class="text-2xl font-bold text-white mb-6 brand">Reseñas de la Comunidad</h3>

          <div v-if="reviews.length === 0" class="card-cream p-10 rounded-3xl text-center text-[#adaaad]">
            Aún no hay reseñas para este establecimiento. ¡Sé el primero!
          </div>

          <div class="space-y-6">
            <article v-for="rev in reviews" :key="rev.id" class="card-cream p-8 rounded-[2rem] shadow-xl text-[#3f3f42]">
              <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold font-headline shadow-sm">
                    {{ initials(rev.author) }}
                  </div>
                  <div>
                    <h4 class="font-bold text-[#0e0e10] text-lg leading-none brand">{{ rev.author || 'Estudiante' }}</h4>
                    <p class="text-xs text-[#adaaad] mt-0.5">{{ new Date(rev.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
                  </div>
                </div>
                <div class="flex gap-0.5 text-orange-500">
                  <span v-for="n in 5" :key="n" class="material-symbols-outlined text-sm" :style="{ fontVariationSettings: `'FILL' ${n <= rev.foodScore ? 1 : 0}` }">star</span>
                </div>
              </div>

              <p v-if="rev.comment" class="text-[#3f3f42] font-medium leading-relaxed font-sans">{{ rev.comment }}</p>

              <div v-if="rev.managerReply" class="mt-6 relative pl-6">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-full"></div>
                <div class="bg-orange-500/5 rounded-2xl p-5 border border-orange-500/10">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-orange-500 text-sm">reply</span>
                    <span class="text-xs font-bold uppercase tracking-wider text-orange-500 brand">Respuesta Oficial</span>
                  </div>
                  <p class="text-[#3f3f42] text-sm italic leading-relaxed font-sans">"{{ rev.managerReply }}"</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
