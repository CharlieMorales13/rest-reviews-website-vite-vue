<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import ManagerReplyModal from './ManagerReplyModal.vue';

// ── Types ─────────────────────────────────────────────────
interface EstablishmentMetrics {
  id: string;
  name: string;
  avgFood: number;
  avgService: number;
  avgPrice: number;
  reviewCount: number;
  sentimentScore: number;
  sentimentDistribution: { positive: number; neutral: number; negative: number; total: number };
}

interface Review {
  id: string;
  author: string;
  comment: string;
  foodScore: number;
  serviceScore: number;
  priceScore: number;
  sentiment: string | null;
  managerReply: string | null;
  managerReplyAt: string | null;
  createdAt: string;
}

// ── State ─────────────────────────────────────────────────
const establishment = ref<EstablishmentMetrics | null>(null);
const reviews = ref<Review[]>([]);
const metricsLoading = ref(true);
const reviewsLoading = ref(true);
const metricsError = ref<string | null>(null);

// ── Computed ──────────────────────────────────────────────
const ige = computed(() => {
  if (!establishment.value) return null;
  const { avgFood, avgService, avgPrice } = establishment.value;
  return ((avgFood * 0.5 + avgService * 0.3 + avgPrice * 0.2) * 20).toFixed(1);
});

const pendingCount = computed(() => reviews.value.filter(r => !r.managerReply).length);

// ── Data fetching ─────────────────────────────────────────
const loadMetrics = async () => {
  metricsLoading.value = true;
  metricsError.value = null;
  try {
    const res = await httpClient.get<{ success: boolean; data: { establishments: EstablishmentMetrics[] } }>('/api/metrics/summary');
    const estabs = res.data.data.establishments;
    if (estabs && estabs.length > 0) {
      establishment.value = estabs[0];
      await loadReviews(estabs[0].id);
    } else {
      metricsError.value = 'No tienes establecimientos asignados. Contacta al administrador.';
    }
  } catch (e: any) {
    metricsError.value = e?.response?.data?.message || 'Error al cargar las métricas.';
  } finally {
    metricsLoading.value = false;
  }
};

const loadReviews = async (estabId: string) => {
  reviewsLoading.value = true;
  try {
    const res = await httpClient.get<{ data: Review[]; meta: any }>(`/api/establishments/${estabId}/reviews?limit=50`);
    reviews.value = res.data.data;
  } catch {
    reviews.value = [];
  } finally {
    reviewsLoading.value = false;
  }
};

onMounted(() => loadMetrics());

// ── Reply modal ───────────────────────────────────────────
const isReplyModalOpen = ref(false);
const selectedReview = ref<Review | null>(null);

const openReplyModal = (review: Review) => {
  selectedReview.value = review;
  isReplyModalOpen.value = true;
};

const handleReplySent = (updated: { reviewId: string; reply: string }) => {
  const rev = reviews.value.find(r => r.id === updated.reviewId);
  if (rev) {
    rev.managerReply = updated.reply;
    rev.managerReplyAt = new Date().toISOString();
  }
  isReplyModalOpen.value = false;
  selectedReview.value = null;
};

// ── Helpers ───────────────────────────────────────────────
const avgRating = (r: Review) => ((r.foodScore + r.serviceScore + r.priceScore) / 3).toFixed(1);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

const sentimentBadge = (s: string | null) => {
  if (s === 'positive') return 'bg-emerald-100 text-emerald-700';
  if (s === 'negative') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
};
const sentimentLabel = (s: string | null) => {
  if (s === 'positive') return 'Positivo';
  if (s === 'negative') return 'Negativo';
  return 'Neutral';
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-fade-in relative">

    <!-- Loading state -->
    <div v-if="metricsLoading" class="space-y-6">
      <div class="h-10 bg-white/5 rounded-2xl w-2/3 animate-pulse"></div>
      <div class="grid grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    </div>

    <!-- Error state (no establishment assigned) -->
    <div v-else-if="metricsError" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-amber-400 text-3xl" style="font-variation-settings: 'FILL' 1;">store_mall_directory</span>
      </div>
      <h2 class="text-xl font-black text-white brand">Sin establecimiento asignado</h2>
      <p class="text-[#adaaad] text-sm max-w-sm">{{ metricsError }}</p>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="establishment">

      <!-- Hero Header -->
      <header class="mb-12">
        <div class="flex items-center gap-3 mb-2">
          <span class="material-symbols-outlined text-orange-500">storefront</span>
          <span class="text-orange-500 font-bold tracking-widest uppercase text-sm">Portal del Gerente</span>
        </div>
        <h1 class="text-4xl lg:text-5xl font-black text-white brand tracking-tight">
          Panel de Control:
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
            {{ establishment.name }}
          </span>
        </h1>
        <p class="text-[#adaaad] mt-4 max-w-2xl text-lg">
          Analiza el rendimiento de tu establecimiento y conecta con los estudiantes mediante respuestas oficiales.
        </p>
      </header>

      <!-- Metrics Grid -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Métricas del Establecimiento</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- IGE -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5 relative overflow-hidden">
            <div class="w-12 h-12 rounded-xl bg-white border border-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">IGE Global</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ ige }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">/ 100</span>
              </div>
            </div>
          </div>

          <!-- Food -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5 relative overflow-hidden">
            <div class="w-12 h-12 rounded-xl bg-white border border-emerald-100 text-emerald-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">thumb_up</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Calidad de Alimentos</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ establishment.avgFood.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">/ 5.0</span>
              </div>
            </div>
          </div>

          <!-- Service -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5 relative overflow-hidden">
            <div class="w-12 h-12 rounded-xl bg-white border border-blue-100 text-blue-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">person</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Servicio</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ establishment.avgService.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">/ 5.0</span>
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5 relative overflow-hidden">
            <div class="w-12 h-12 rounded-xl bg-white border border-purple-100 text-purple-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">payments</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Precio-Calidad</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ establishment.avgPrice.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">/ 5.0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sentiment strip -->
        <div v-if="establishment.sentimentDistribution.total > 0" class="mt-6 card-cream rounded-2xl p-6 border border-black/5 flex flex-wrap gap-6 items-center">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-[#525155] mb-1">Distribución de Sentimiento</p>
            <p class="text-sm text-[#adaaad]">{{ establishment.sentimentDistribution.total }} reseñas analizadas</p>
          </div>
          <div class="flex items-center gap-4 flex-wrap">
            <span class="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              {{ establishment.sentimentDistribution.positive }} positivas
            </span>
            <span class="flex items-center gap-1.5 text-sm font-bold text-[#adaaad]">
              <span class="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              {{ establishment.sentimentDistribution.neutral }} neutrales
            </span>
            <span class="flex items-center gap-1.5 text-sm font-bold text-red-500">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              {{ establishment.sentimentDistribution.negative }} negativas
            </span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <div class="w-24 h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                class="h-full bg-emerald-400 rounded-full"
                :style="{ width: `${establishment.sentimentScore}%` }"
              ></div>
            </div>
            <span class="text-sm font-bold text-[#0e0e10]">{{ establishment.sentimentScore.toFixed(0) }}% positivo</span>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold tracking-tight text-white brand">Reseñas de Estudiantes</h2>
          <div class="flex items-center gap-3">
            <span v-if="pendingCount > 0" class="bg-orange-500/20 text-orange-500 font-bold px-3 py-1 rounded-full text-sm">
              {{ pendingCount }} sin responder
            </span>
            <span v-else class="bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">done_all</span>
              Todo respondido
            </span>
          </div>
        </div>

        <!-- Loading reviews -->
        <div v-if="reviewsLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-36 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="reviews.length === 0" class="text-center py-16 card-cream rounded-[1.5rem] border border-dashed border-black/10">
          <span class="material-symbols-outlined text-5xl text-[#adaaad] mb-2">rate_review</span>
          <p class="text-[#525155] font-bold">Sin reseñas todavía</p>
          <p class="text-sm text-[#adaaad]">Cuando los estudiantes califiquen tu establecimiento, aparecerán aquí.</p>
        </div>

        <!-- Review cards -->
        <div v-else class="grid grid-cols-1 gap-5">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="card-cream rounded-[1.5rem] p-6 shadow-sm border border-black/5"
          >
            <div class="flex justify-between items-start flex-col sm:flex-row gap-4 mb-4">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {{ (review.author ?? '?').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-bold text-[#0e0e10] brand">{{ review.author ?? 'Estudiante' }}</p>
                  <p class="text-xs text-[#adaaad]">{{ formatDate(review.createdAt) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <span :class="['px-2 py-0.5 rounded-full text-xs font-bold', sentimentBadge(review.sentiment)]">
                  {{ sentimentLabel(review.sentiment) }}
                </span>
                <div class="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-black/5">
                  <span class="material-symbols-outlined text-orange-500 text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                  <span class="font-bold text-[#0e0e10] text-sm">{{ avgRating(review) }}</span>
                </div>
              </div>
            </div>

            <!-- Scores -->
            <div class="flex gap-4 mb-3 flex-wrap">
              <span class="text-xs text-[#adaaad]">Comida: <strong class="text-[#0e0e10]">{{ review.foodScore }}/5</strong></span>
              <span class="text-xs text-[#adaaad]">Servicio: <strong class="text-[#0e0e10]">{{ review.serviceScore }}/5</strong></span>
              <span class="text-xs text-[#adaaad]">Precio: <strong class="text-[#0e0e10]">{{ review.priceScore }}/5</strong></span>
            </div>

            <p class="text-[#3f3f42] mb-4">"{{ review.comment }}"</p>

            <!-- Manager reply (if exists) -->
            <div v-if="review.managerReply" class="mt-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-orange-500 text-sm" style="font-variation-settings: 'FILL' 1;">storefront</span>
                <span class="text-xs font-bold text-orange-600 uppercase tracking-wide">Respuesta del establecimiento</span>
              </div>
              <p class="text-sm text-[#3f3f42]">{{ review.managerReply }}</p>
            </div>

            <!-- Reply button (if not replied yet) -->
            <div v-else class="flex justify-end mt-2">
              <button
                @click="openReplyModal(review)"
                class="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md text-sm"
              >
                <span class="material-symbols-outlined text-sm">reply</span>
                Responder
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <ManagerReplyModal
      :isOpen="isReplyModalOpen"
      :review="selectedReview"
      @close="isReplyModalOpen = false"
      @sent="handleReplySent"
    />
  </div>
</template>
