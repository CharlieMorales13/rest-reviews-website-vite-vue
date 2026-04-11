<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import ManagerReplyModal from './ManagerReplyModal.vue';

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
  reviewsLastMonth: number;
  nps: number;
  criticalMentionsCount: number;
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

// ── KPI 1 — CSAT (Sentiment Index) ────────────────────────────────────────────
const csat = computed(() => establishment.value?.sentimentScore ?? 0);

const csatLabel = computed(() => {
  const v = csat.value;
  if (v >= 80) return 'Excelente';
  if (v >= 60) return 'Satisfactorio';
  if (v >= 35) return 'Área de Mejora';
  return 'Crisis Operativa';
});

const csatColor = computed(() => {
  const v = csat.value;
  if (v >= 80) return { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' };
  if (v >= 60) return { bar: 'bg-green-400', badge: 'bg-green-100 text-green-700', icon: 'text-green-500' };
  if (v >= 35) return { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' };
  return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', icon: 'text-red-500' };
});

// ── KPI 2 — Reseñas + Tendencia ────────────────────────────────────────────────
const reviewsThisMonth = computed(() => establishment.value?.reviewsThisMonth ?? 0);
const reviewsLastMonth = computed(() => establishment.value?.reviewsLastMonth ?? 0);

const reviewTrend = computed(() => {
  const last = reviewsLastMonth.value;
  const curr = reviewsThisMonth.value;
  if (last === 0) return null;
  return Math.round(((curr - last) / last) * 100);
});

// ── KPI 3 — NPS ───────────────────────────────────────────────────────────────
const nps = computed(() => establishment.value?.nps ?? 0);

const npsLabel = computed(() => {
  const v = nps.value;
  if (v >= 70) return 'Excelente';
  if (v >= 30) return 'Bueno';
  if (v >= 0) return 'Regular';
  return 'Detractores dominan';
});

const npsColor = computed(() => {
  const v = nps.value;
  if (v >= 70) return { text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
  if (v >= 30) return { text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
  if (v >= 0) return { text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
  return { text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
});

// ── KPI 4 — Menciones Críticas ────────────────────────────────────────────────
const criticalCount = computed(() => establishment.value?.criticalMentionsCount ?? 0);

const criticalLabel = computed(() => {
  const v = criticalCount.value;
  if (v === 0) return 'Sin alertas';
  if (v <= 2) return 'Atención moderada';
  return 'Atención urgente';
});

const criticalColor = computed(() => {
  const v = criticalCount.value;
  if (v === 0) return { icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
  if (v <= 2) return { icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' };
  return { icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
});

// ── Section 2 — Salud del Servicio (distribución + Sentimiento Neto) ──────────
const healthDistribution = computed(() => {
  const d = establishment.value?.sentimentDistribution;
  if (!d || d.total === 0) return { positive: 0, neutral: 0, negative: 0 };
  const pct = (n: number) => Number(((n / d.total) * 100).toFixed(1));
  return { positive: pct(d.positive), neutral: pct(d.neutral), negative: pct(d.negative) };
});

/** Net Sentiment per dimension: (4+5 stars − 1+2 stars) / total × 100 */
function netSentimentScore(bins: number[]): number {
  const total = bins.reduce((s, n) => s + n, 0);
  if (total === 0) return 0;
  const positive = (bins[3] ?? 0) + (bins[4] ?? 0);
  const negative = (bins[0] ?? 0) + (bins[1] ?? 0);
  return Math.round(((positive - negative) / total) * 100);
}

const netSentiment = computed(() => {
  const dist = establishment.value?.scoreDistribution;
  if (!dist) return [];
  return [
    { label: 'Comida', value: netSentimentScore(dist.food) },
    { label: 'Servicio', value: netSentimentScore(dist.service) },
    { label: 'Precio / Valor', value: netSentimentScore(dist.price) },
  ];
});

const netBarWidth = (value: number) => `${Math.min(Math.abs(value) / 2, 50)}%`;

// ── Section 3 — Alertas Operativas ────────────────────────────────────────────
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
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="h-36 bg-white/5 rounded-2xl animate-pulse"></div>
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
           SECCIÓN 1 — KPIs (4 tarjetas)
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Métricas Clave</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <!-- KPI 1: CSAT -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-xl" :class="csatColor.icon" style="font-variation-settings: 'FILL' 1;">sentiment_satisfied</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="csatColor.badge">{{ csatLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">CSAT</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-[#0e0e10] brand">{{ csat.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">%</span>
              </div>
              <p class="text-xs text-[#adaaad] mt-0.5">Clientes satisfechos</p>
              <div class="mt-3 w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :class="csatColor.bar" :style="{ width: `${csat}%` }"></div>
              </div>
            </div>
          </div>

          <!-- KPI 2: Reseñas este mes + tendencia -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white border border-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">rate_review</span>
              </div>
              <span
                v-if="reviewTrend !== null"
                class="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                :class="reviewTrend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'"
              >
                <span class="material-symbols-outlined text-xs" style="font-size:14px;">
                  {{ reviewTrend >= 0 ? 'trending_up' : 'trending_down' }}
                </span>
                {{ reviewTrend > 0 ? '+' : '' }}{{ reviewTrend }}% vs mes ant.
              </span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Reseñas este mes</h3>
              <span class="text-3xl font-black text-[#0e0e10] brand">{{ reviewsThisMonth }}</span>
              <p class="text-xs text-[#adaaad] mt-0.5">{{ establishment.reviewCount }} en total acumulado</p>
            </div>
          </div>

          <!-- KPI 3: NPS -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white border border-blue-100 text-blue-500 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">recommend</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="npsColor.badge">{{ npsLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">NPS</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black brand" :class="npsColor.text">
                  {{ nps > 0 ? '+' : '' }}{{ nps }}
                </span>
              </div>
              <p class="text-xs text-[#adaaad] mt-0.5">Net Promoter Score</p>
            </div>
          </div>

          <!-- KPI 4: Menciones Críticas -->
          <div class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-xl" :class="criticalColor.icon" style="font-variation-settings: 'FILL' 1;">warning</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="criticalColor.badge">{{ criticalLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">Menciones Críticas</h3>
              <span class="text-3xl font-black text-[#0e0e10] brand">{{ criticalCount }}</span>
              <p class="text-xs text-[#adaaad] mt-0.5">Alertas de calidad e higiene</p>
            </div>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN 2 — Salud del Servicio
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Salud del Servicio</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <!-- Distribución de Satisfacción -->
          <div class="card-cream rounded-[1.5rem] p-6 border border-black/5 shadow-sm">
            <p class="text-xs text-[#525155] font-bold uppercase tracking-widest mb-5">
              Distribución de Satisfacción
            </p>
            <div class="space-y-4">
              <!-- Positivo -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-emerald-600">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>Satisfechos
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ healthDistribution.positive }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-400 transition-all duration-700" :style="{ width: `${healthDistribution.positive}%` }"></div>
                </div>
              </div>
              <!-- Neutral -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-[#adaaad]">
                    <span class="w-2.5 h-2.5 rounded-full bg-gray-300"></span>Indiferentes
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ healthDistribution.neutral }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                  <div class="h-full rounded-full bg-gray-300 transition-all duration-700" :style="{ width: `${healthDistribution.neutral}%` }"></div>
                </div>
              </div>
              <!-- Negativo -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-red-500">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>Insatisfechos
                  </span>
                  <span class="font-black text-[#0e0e10]">{{ healthDistribution.negative }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                  <div class="h-full rounded-full bg-red-400 transition-all duration-700" :style="{ width: `${healthDistribution.negative}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sentimiento Neto por Aspecto (diverging bars) -->
          <div class="card-cream rounded-[1.5rem] p-6 border border-black/5 shadow-sm">
            <p class="text-xs text-[#525155] font-bold uppercase tracking-widest mb-1">
              Sentimiento Neto por Aspecto
            </p>
            <p class="text-xs text-[#adaaad] mb-5">
              Diferencia entre calificaciones altas (4–5★) y bajas (1–2★)
            </p>

            <div v-if="establishment.reviewCount === 0" class="py-8 text-center text-[#adaaad] text-sm">
              Sin datos suficientes.
            </div>

            <div v-else class="space-y-5">
              <div v-for="dim in netSentiment" :key="dim.label">
                <div class="flex justify-between items-center text-sm mb-2">
                  <span class="font-bold text-[#3f3f42]">{{ dim.label }}</span>
                  <span
                    class="font-black text-sm"
                    :class="dim.value >= 0 ? 'text-emerald-600' : 'text-red-500'"
                  >
                    {{ dim.value > 0 ? '+' : '' }}{{ dim.value }}%
                  </span>
                </div>
                <!-- Diverging bar -->
                <div class="relative h-5 rounded-full bg-black/5 overflow-hidden">
                  <!-- Center line -->
                  <div class="absolute inset-y-0 left-1/2 w-px bg-black/15 z-10"></div>
                  <!-- Positive (right) -->
                  <div
                    v-if="dim.value >= 0"
                    class="absolute inset-y-0 rounded-r-full bg-emerald-400 transition-all duration-700"
                    :style="{ left: '50%', width: netBarWidth(dim.value) }"
                  ></div>
                  <!-- Negative (left) -->
                  <div
                    v-else
                    class="absolute inset-y-0 rounded-l-full bg-red-400 transition-all duration-700"
                    :style="{ right: '50%', width: netBarWidth(dim.value) }"
                  ></div>
                </div>
                <div class="flex justify-between text-[10px] text-[#adaaad] mt-1 px-1">
                  <span>← Insatisfecho</span>
                  <span>Satisfecho →</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN 3 — Alertas Operativas
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
