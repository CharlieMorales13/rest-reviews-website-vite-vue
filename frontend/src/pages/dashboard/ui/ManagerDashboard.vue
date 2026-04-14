<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { httpClient } from '@/shared/api/httpClient';

const router = useRouter();

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

// ── State ──────────────────────────────────────────────────────────────────────
const establishment = ref<EstablishmentMetrics | null>(null);
const metricsLoading = ref(true);
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
  } catch (e: any) {
    metricsError.value = e?.response?.data?.message || 'Error al cargar las métricas.';
  } finally {
    metricsLoading.value = false;
  }
};

onMounted(() => loadMetrics());
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
           ACCESO RÁPIDO — Mi Establecimiento
      ══════════════════════════════════════════════════════════════════════════ -->
      <section>
        <div
          class="card-cream rounded-[1.5rem] p-6 border border-black/5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-orange-500/30 transition-colors"
          @click="router.push('/manager/mi-establecimiento')"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-orange-500 text-2xl" style="font-variation-settings: 'FILL' 1;">storefront</span>
            </div>
            <div>
              <p class="font-bold text-[#0e0e10] brand text-lg">Mi Establecimiento</p>
              <p class="text-sm text-[#adaaad]">Publica novedades, responde reseñas y edita el perfil de tu local.</p>
            </div>
          </div>
          <span class="material-symbols-outlined text-[#adaaad] text-2xl flex-shrink-0">arrow_forward_ios</span>
        </div>
      </section>

    </template>
  </div>
</template>
