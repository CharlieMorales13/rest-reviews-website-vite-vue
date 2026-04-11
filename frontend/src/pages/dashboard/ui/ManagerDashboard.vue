<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { httpClient } from '@/shared/api/httpClient';
import ManagerReplyModal from './ManagerReplyModal.vue';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface ScoreBins { food: number[]; service: number[]; price: number[] }

interface NegativeTerm { term: string; mentions: number }

interface EstablishmentMetrics {
  id: string;
  name: string;
  avgFood: number;
  avgService: number;
  avgPrice: number;
  reviewCount: number;
  sentimentScore: number;
  sentimentDistribution: SentimentDistribution;
  reviewsThisMonth: number;
  scoreDistribution: ScoreBins;
  negativeTerms: NegativeTerm[];
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

// ── State ──────────────────────────────────────────────────────────────────────
const establishment = ref<EstablishmentMetrics | null>(null);
const reviews = ref<Review[]>([]);
const metricsLoading = ref(true);
const reviewsLoading = ref(true);
const metricsError = ref<string | null>(null);

// ── Section 1 — Key Metrics ────────────────────────────────────────────────────
/** Sentiment Index: % of total classified reviews that are positive. */
const sentimentIndex = computed<number>(() => establishment.value?.sentimentScore ?? 0);

/** Polarity breakdown as percentages for positive / neutral / negative. */
const polarityRatio = computed(() => {
  const d = establishment.value?.sentimentDistribution;
  if (!d || d.total === 0) return { positive: 0, neutral: 0, negative: 0 };
  const pct = (n: number) => Number(((n / d.total) * 100).toFixed(1));
  return { positive: pct(d.positive), neutral: pct(d.neutral), negative: pct(d.negative) };
});

const reviewsThisMonth = computed<number>(() => establishment.value?.reviewsThisMonth ?? 0);

// ── Section 2 — Score Distribution Chart ──────────────────────────────────────
const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const chartLabels = ['★1', '★2', '★3', '★4', '★5'];

function buildChartData(dist: ScoreBins) {
  return {
    labels: chartLabels,
    datasets: [
      {
        label: 'Comida',
        data: dist.food,
        backgroundColor: 'rgba(249, 115, 22, 0.75)',
      },
      {
        label: 'Servicio',
        data: dist.service,
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
      },
      {
        label: 'Precio/Valor',
        data: dist.price,
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
      },
    ],
  };
}

async function renderChart(dist: ScoreBins) {
  await nextTick();
  if (!chartRef.value) return;

  if (chartInstance) {
    chartInstance.data = buildChartData(dist);
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: buildChartData(dist),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} reseñas`,
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
        },
      },
    },
  });
}

onUnmounted(() => {
  chartInstance?.destroy();
  chartInstance = null;
});

// ── Section 3 — Negative Terms ─────────────────────────────────────────────────
const sortedNegativeTerms = computed<NegativeTerm[]>(() =>
  [...(establishment.value?.negativeTerms ?? [])].sort((a, b) => b.mentions - a.mentions)
);

const maxMentions = computed(() => sortedNegativeTerms.value[0]?.mentions ?? 1);
const mentionBarWidth = (mentions: number) =>
  `${Math.round((mentions / maxMentions.value) * 100)}%`;

// ── Data fetching ──────────────────────────────────────────────────────────────
const loadMetrics = async () => {
  metricsLoading.value = true;
  metricsError.value = null;
  try {
    const res = await httpClient.get<{
      success: boolean;
      data: { establishments: EstablishmentMetrics[] };
    }>('/api/metrics/summary');

    const first = res.data.data.establishments?.[0];
    if (!first) {
      metricsError.value = 'No tienes establecimientos asignados. Contacta al administrador.';
      return;
    }

    establishment.value = first;
    metricsLoading.value = false;
    await renderChart(first.scoreDistribution);
    await loadReviews(first.id);
  } catch (e: any) {
    metricsError.value = e?.response?.data?.message || 'Error al cargar las métricas.';
  } finally {
    metricsLoading.value = false;
  }
};

const loadReviews = async (estabId: string) => {
  reviewsLoading.value = true;
  try {
    const res = await httpClient.get<{ data: Review[]; meta: any }>(
      `/api/establishments/${estabId}/reviews?limit=50`
    );
    reviews.value = res.data.data;
  } catch {
    reviews.value = [];
  } finally {
    reviewsLoading.value = false;
  }
};

onMounted(() => loadMetrics());

// ── Reply modal ────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────
const pendingCount = computed(() => reviews.value.filter(r => !r.managerReply).length);

const avgRating = (r: Review) =>
  ((r.foodScore + r.serviceScore + r.priceScore) / 3).toFixed(1);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

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

    <!-- Loading -->
    <div v-if="metricsLoading" class="space-y-6">
      <div class="h-10 bg-white/5 rounded-2xl w-2/3 animate-pulse"></div>
      <div class="grid grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    </div>

    <!-- No establishment -->
    <div v-else-if="metricsError" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-amber-400 text-3xl" style="font-variation-settings: 'FILL' 1;">store_mall_directory</span>
      </div>
      <h2 class="text-xl font-black text-white brand">Sin establecimiento asignado</h2>
      <p class="text-[#adaaad] text-sm max-w-sm">{{ metricsError }}</p>
    </div>

    <template v-else-if="establishment">

      <!-- Header -->
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
      </header>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN SUPERIOR — Métricas Clave
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Métricas Clave</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <!-- Índice de Sentimiento Global -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="w-12 h-12 rounded-xl bg-white border border-emerald-100 text-emerald-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">sentiment_satisfied</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Índice de Sentimiento</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ sentimentIndex.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">% positivo</span>
              </div>
              <div class="mt-3 w-full h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="sentimentIndex >= 60 ? 'bg-emerald-400' : sentimentIndex >= 35 ? 'bg-amber-400' : 'bg-red-400'"
                  :style="{ width: `${sentimentIndex}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Total de Reseñas del mes -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="w-12 h-12 rounded-xl bg-white border border-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">rate_review</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Reseñas este mes</h3>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ reviewsThisMonth }}</span>
              </div>
              <p class="text-xs text-[#adaaad] mt-1">{{ establishment.reviewCount }} en total</p>
            </div>
          </div>

          <!-- Ratio de Polaridad -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="w-12 h-12 rounded-xl bg-white border border-blue-100 text-blue-500 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">donut_small</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Ratio de Polaridad</h3>
              <div class="flex flex-col gap-1.5 mt-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5 font-bold text-emerald-600">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>Positivo
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ polarityRatio.positive }}%</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5 font-bold text-[#adaaad]">
                    <span class="w-2 h-2 rounded-full bg-gray-300 shrink-0"></span>Neutral
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ polarityRatio.neutral }}%</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5 font-bold text-red-500">
                    <span class="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>Negativo
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ polarityRatio.negative }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN MEDIA — Distribución de Calificaciones (Chart.js)
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Distribución de Calificaciones por Aspecto</h2>

        <div class="card-cream rounded-[1.5rem] p-6 border border-black/5 shadow-sm">
          <p class="text-xs text-[#525155] font-bold uppercase tracking-widest mb-4">
            Número de reseñas por puntuación (1–5) — Comida · Servicio · Precio/Valor
          </p>

          <div v-if="establishment.reviewCount === 0" class="py-16 text-center text-[#adaaad] text-sm">
            Sin datos suficientes para mostrar la distribución.
          </div>

          <div v-else class="relative h-72">
            <canvas ref="chartRef"></canvas>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN INFERIOR — Alertas Operativas: Términos Negativos
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Alertas Operativas</h2>

        <div class="card-cream rounded-[1.5rem] p-6 border border-black/5 shadow-sm">
          <p class="text-xs text-[#525155] font-bold uppercase tracking-widest mb-4">
            Términos más frecuentes en reseñas negativas
          </p>

          <div v-if="sortedNegativeTerms.length === 0" class="py-12 text-center space-y-2">
            <span class="material-symbols-outlined text-3xl text-[#adaaad]">manage_search</span>
            <p class="text-sm text-[#adaaad] font-bold">
              Datos disponibles tras ejecutar el pipeline de analítica.
            </p>
          </div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="text-left border-b border-black/5">
                <th class="pb-3 text-xs font-bold uppercase tracking-widest text-[#525155] w-8">#</th>
                <th class="pb-3 text-xs font-bold uppercase tracking-widest text-[#525155]">Término</th>
                <th class="pb-3 text-xs font-bold uppercase tracking-widest text-[#525155]">Menciones</th>
                <th class="pb-3 text-xs font-bold uppercase tracking-widest text-[#525155] w-1/3">Frecuencia relativa</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(term, idx) in sortedNegativeTerms"
                :key="term.term"
                class="border-b border-black/5 last:border-0"
              >
                <td class="py-3 text-[#adaaad] font-bold">{{ idx + 1 }}</td>
                <td class="py-3 font-bold text-[#0e0e10]">{{ term.term }}</td>
                <td class="py-3 font-black text-red-500">{{ term.mentions }}</td>
                <td class="py-3">
                  <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                    <div
                      class="h-full bg-red-400 rounded-full transition-all duration-500"
                      :style="{ width: mentionBarWidth(term.mentions) }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           RESEÑAS — Lista con modal de respuesta
      ══════════════════════════════════════════════════════════════════════════ -->
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

        <div v-if="reviewsLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-36 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-16 card-cream rounded-[1.5rem] border border-dashed border-black/10">
          <span class="material-symbols-outlined text-5xl text-[#adaaad] mb-2">rate_review</span>
          <p class="text-[#525155] font-bold">Sin reseñas todavía</p>
          <p class="text-sm text-[#adaaad]">Cuando los estudiantes califiquen tu establecimiento, aparecerán aquí.</p>
        </div>

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

            <div class="flex gap-4 mb-3 flex-wrap">
              <span class="text-xs text-[#adaaad]">Comida: <strong class="text-[#0e0e10]">{{ review.foodScore }}/5</strong></span>
              <span class="text-xs text-[#adaaad]">Servicio: <strong class="text-[#0e0e10]">{{ review.serviceScore }}/5</strong></span>
              <span class="text-xs text-[#adaaad]">Precio: <strong class="text-[#0e0e10]">{{ review.priceScore }}/5</strong></span>
            </div>

            <p class="text-[#3f3f42] mb-4">"{{ review.comment }}"</p>

            <div v-if="review.managerReply" class="mt-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-orange-500 text-sm" style="font-variation-settings: 'FILL' 1;">storefront</span>
                <span class="text-xs font-bold text-orange-600 uppercase tracking-wide">Respuesta del establecimiento</span>
              </div>
              <p class="text-sm text-[#3f3f42]">{{ review.managerReply }}</p>
            </div>

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
