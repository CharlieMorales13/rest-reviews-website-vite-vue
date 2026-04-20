<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { httpClient } from '@/shared/api/httpClient';
import { extractErrorMessage } from '@/shared/lib/extractError';

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
  if (v >= 80) return { bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400', icon: 'text-emerald-400' };
  if (v >= 60) return { bar: 'bg-green-400', badge: 'bg-green-500/20 text-green-400', icon: 'text-green-400' };
  if (v >= 35) return { bar: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-400', icon: 'text-amber-400' };
  return { bar: 'bg-red-500', badge: 'bg-red-500/20 text-red-400', icon: 'text-red-400' };
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
  if (v >= 70) return { text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' };
  if (v >= 30) return { text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' };
  if (v >= 0) return { text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' };
  return { text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' };
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
  if (v === 0) return { icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' };
  if (v <= 2) return { icon: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' };
  return { icon: 'text-red-400', badge: 'bg-red-500/20 text-red-400' };
});

// ── IGE — Índice de Experiencia Gastronómica ──────────────────────────────────
const ige = computed(() => {
  const e = establishment.value;
  if (!e) return 0;
  return Math.min(Math.round(((e.avgFood * 0.5 + e.avgService * 0.3 + e.avgPrice * 0.2) * 20) * 10) / 10, 100);
});

const igeLabel = computed(() => {
  const v = ige.value;
  if (v >= 80) return 'Excelente';
  if (v >= 65) return 'Satisfactorio';
  if (v >= 50) return 'En desarrollo';
  return 'Crítico';
});

const igeColor = computed(() => {
  const v = ige.value;
  if (v >= 80) return { bar: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' };
  if (v >= 65) return { bar: 'bg-green-400', badge: 'bg-green-500/20 text-green-400', text: 'text-green-400' };
  if (v >= 50) return { bar: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-400', text: 'text-amber-400' };
  return { bar: 'bg-red-500', badge: 'bg-red-500/20 text-red-400', text: 'text-red-400' };
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

// ── Section 3 — Tópicos Frecuentes ────────────────────────────────────────────
const sortedNegativeTerms = computed(() => {
  const terms = establishment.value?.negativeTerms ?? [];
  return [...terms].sort((a, b) => b.mentions - a.mentions);
});

const maxMentions = computed(() => sortedNegativeTerms.value[0]?.mentions ?? 1);

function termTier(mentions: number): 'high' | 'mid' | 'low' {
  const max = maxMentions.value;
  if (mentions >= max * 0.66) return 'high';
  if (mentions >= max * 0.33) return 'mid';
  return 'low';
}

const tierClasses = {
  high: 'bg-red-500/10 border border-red-500/20 text-red-300',
  mid: 'bg-amber-500/10 border border-amber-500/20 text-amber-300',
  low: 'bg-white/5 border border-white/10 text-[#adaaad]',
};

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
  } catch (e: unknown) {
    metricsError.value = extractErrorMessage(e, 'Error al cargar las métricas.');
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
           IGE — Hero metric
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-8">
        <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-8">
          <div class="flex flex-col lg:flex-row lg:items-center gap-6">
            <!-- Left: label + score -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <span class="material-symbols-outlined text-orange-500 text-2xl" style="font-variation-settings: 'FILL' 1;">trophy</span>
                <p class="text-xs font-bold uppercase tracking-widest text-[#adaaad]">IGE — Índice de Experiencia Gastronómica</p>
              </div>
              <div class="flex items-baseline gap-3 mb-1">
                <span class="text-6xl font-black brand text-white">{{ ige.toFixed(1) }}</span>
                <span class="text-2xl font-semibold text-[#adaaad]">/ 100</span>
                <span class="text-sm font-bold px-3 py-1 rounded-full" :class="igeColor.badge">{{ igeLabel }}</span>
              </div>
              <p class="text-xs text-[#adaaad]">Comida ×0.5 · Atención ×0.3 · Precio ×0.2</p>
            </div>
            <!-- Right: progress bar -->
            <div class="flex-1 lg:max-w-sm">
              <div class="flex justify-between text-xs text-[#adaaad] mb-2">
                <span>0</span>
                <span class="font-bold" :class="igeColor.text">{{ ige.toFixed(1) }}</span>
                <span>100</span>
              </div>
              <div class="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="igeColor.bar"
                  :style="{ width: `${ige}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] text-[#adaaad]/60 mt-1.5">
                <span>Crítico</span>
                <span>En desarrollo</span>
                <span>Satisfactorio</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SECCIÓN 1 — KPIs (4 tarjetas)
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Métricas Clave</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <!-- KPI 1: CSAT -->
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl" :class="csatColor.icon" style="font-variation-settings: 'FILL' 1;">sentiment_satisfied</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="csatColor.badge">{{ csatLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#adaaad] text-xs font-bold mb-1 uppercase tracking-widest">CSAT</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-white brand">{{ csat.toFixed(1) }}</span>
                <span class="text-sm font-semibold text-[#8e8d91]">%</span>
              </div>
              <p class="text-xs text-[#adaaad] mt-0.5">Clientes satisfechos</p>
              <div class="mt-3 w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :class="csatColor.bar" :style="{ width: `${csat}%` }"></div>
              </div>
            </div>
          </div>

          <!-- KPI 2: Reseñas este mes + tendencia -->
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">rate_review</span>
              </div>
              <span
                v-if="reviewTrend !== null"
                class="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                :class="reviewTrend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'"
              >
                <span class="material-symbols-outlined text-xs" style="font-size:14px;">
                  {{ reviewTrend >= 0 ? 'trending_up' : 'trending_down' }}
                </span>
                {{ reviewTrend > 0 ? '+' : '' }}{{ reviewTrend }}% vs mes ant.
              </span>
            </div>
            <div>
              <h3 class="text-[#adaaad] text-xs font-bold mb-1 uppercase tracking-widest">Reseñas este mes</h3>
              <span class="text-3xl font-black text-white brand">{{ reviewsThisMonth }}</span>
              <p class="text-xs text-[#adaaad] mt-0.5">{{ establishment.reviewCount }} en total acumulado</p>
            </div>
          </div>

          <!-- KPI 3: NPS -->
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">recommend</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="npsColor.badge">{{ npsLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#adaaad] text-xs font-bold mb-1 uppercase tracking-widest">NPS</h3>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black brand" :class="npsColor.text">
                  {{ nps > 0 ? '+' : '' }}{{ nps }}
                </span>
              </div>
              <p class="text-xs text-[#adaaad] mt-0.5">Net Promoter Score</p>
            </div>
          </div>

          <!-- KPI 4: Menciones Críticas -->
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl" :class="criticalColor.icon" style="font-variation-settings: 'FILL' 1;">warning</span>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="criticalColor.badge">{{ criticalLabel }}</span>
            </div>
            <div>
              <h3 class="text-[#adaaad] text-xs font-bold mb-1 uppercase tracking-widest">Menciones Críticas</h3>
              <span class="text-3xl font-black text-white brand">{{ criticalCount }}</span>
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
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6">
            <p class="text-xs text-[#adaaad] font-bold uppercase tracking-widest mb-5">
              Distribución de Satisfacción
            </p>
            <div class="space-y-4">
              <!-- Positivo -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>Satisfechos
                  </span>
                  <span class="font-black text-white">{{ healthDistribution.positive }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-400 transition-all duration-700" :style="{ width: `${healthDistribution.positive}%` }"></div>
                </div>
              </div>
              <!-- Neutral -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-[#adaaad]">
                    <span class="w-2.5 h-2.5 rounded-full bg-gray-300"></span>Indiferentes
                  </span>
                  <span class="font-black text-white">{{ healthDistribution.neutral }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-gray-300 transition-all duration-700" :style="{ width: `${healthDistribution.neutral}%` }"></div>
                </div>
              </div>
              <!-- Negativo -->
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="flex items-center gap-1.5 font-bold text-red-400">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>Insatisfechos
                  </span>
                  <span class="font-black text-white">{{ healthDistribution.negative }}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-red-400 transition-all duration-700" :style="{ width: `${healthDistribution.negative}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sentimiento Neto por Aspecto (diverging bars) -->
          <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6">
            <p class="text-xs text-[#adaaad] font-bold uppercase tracking-widest mb-1">
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
                  <span class="font-bold text-[#c9c7cc]">{{ dim.label }}</span>
                  <span
                    class="font-black text-sm"
                    :class="dim.value >= 0 ? 'text-emerald-400' : 'text-red-400'"
                  >
                    {{ dim.value > 0 ? '+' : '' }}{{ dim.value }}%
                  </span>
                </div>
                <!-- Diverging bar -->
                <div class="relative h-5 rounded-full bg-white/10 overflow-hidden">
                  <!-- Center line -->
                  <div class="absolute inset-y-0 left-1/2 w-px bg-white/20 z-10"></div>
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
           SECCIÓN 3 — Tópicos Frecuentes
      ══════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-16">
        <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Tópicos Frecuentes</h2>

        <div class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6">
          <p class="text-xs text-[#adaaad]">
            Términos negativos detectados por IA en las reseñas de tu establecimiento
          </p>

          <!-- Empty state -->
          <div
            v-if="sortedNegativeTerms.length === 0 || establishment.reviewCount === 0"
            class="flex flex-col items-center justify-center py-10 gap-3 text-center"
          >
            <span class="material-symbols-outlined text-4xl text-[#adaaad]/40" style="font-variation-settings: 'FILL' 1;">psychology</span>
            <p class="text-sm text-[#adaaad] max-w-xs">
              El modelo aún no ha procesado reseñas. Ejecuta el pipeline desde el panel de administración.
            </p>
          </div>

          <!-- Pills -->
          <div v-else class="flex flex-wrap gap-3 mt-4">
            <span
              v-for="term in sortedNegativeTerms"
              :key="term.term"
              class="px-3 py-1.5 rounded-full inline-flex items-center"
              :class="tierClasses[termTier(term.mentions)]"
              :style="{ fontSize: `clamp(0.8rem, ${0.8 + (term.mentions / maxMentions) * 0.8}rem, 1.6rem)` }"
            >
              {{ term.term.toLowerCase() }}<sup class="text-[10px] ml-0.5 opacity-60">{{ term.mentions }}</sup>
            </span>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           ACCESO RÁPIDO — Mi Establecimiento
      ══════════════════════════════════════════════════════════════════════════ -->
      <section>
        <div
          class="bg-white/5 backdrop-blur border border-white/10 rounded-[1.5rem] p-6 flex items-center justify-between gap-4 cursor-pointer hover:border-orange-500/30 transition-colors"
          @click="router.push('/manager/mi-establecimiento')"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-orange-500 text-2xl" style="font-variation-settings: 'FILL' 1;">storefront</span>
            </div>
            <div>
              <p class="font-bold text-white brand text-lg">Mi Establecimiento</p>
              <p class="text-sm text-[#adaaad]">Publica novedades, responde reseñas y edita el perfil de tu local.</p>
            </div>
          </div>
          <span class="material-symbols-outlined text-[#adaaad] text-2xl flex-shrink-0">arrow_forward_ios</span>
        </div>
      </section>

    </template>
  </div>
</template>
