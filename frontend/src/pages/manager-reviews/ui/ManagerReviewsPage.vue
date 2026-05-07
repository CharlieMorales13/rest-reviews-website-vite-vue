<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ReviewService } from '@/entities/review/api/ReviewService';
import { useAuthStore } from '@/entities/user/model/authStore';
import ReviewCard from '@/shared/ui/ReviewCard.vue';
import ManagerReplyModal from '@/pages/dashboard/ui/ManagerReplyModal.vue';
import Pagination from '@/widgets/pagination/ui/Pagination.vue';
import type { EstablishmentReview } from '@/entities/review/model/types';
import type { Establishment } from '@/entities/review/model/types';

const authStore = useAuthStore();

const est = ref<Establishment | null>(null);
const reviews = ref<EstablishmentReview[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const searchQuery = ref('');
const sentimentFilter = ref<'all' | 'positive' | 'neutral' | 'negative'>('all');
const currentPage = ref(1);
const PAGE_SIZE = 10;

const sentimentOptions = [
  { key: 'all',      label: 'Todas' },
  { key: 'positive', label: 'Positivas' },
  { key: 'neutral',  label: 'Neutras' },
  { key: 'negative', label: 'Negativas' },
] as const;

const filteredReviews = computed(() => {
  let list = reviews.value;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) list = list.filter(r => r.comment?.toLowerCase().includes(q) || r.author?.toLowerCase().includes(q));
  if (sentimentFilter.value !== 'all') list = list.filter(r => r.sentiment === sentimentFilter.value);
  return list;
});

const totalPages = computed(() => Math.ceil(filteredReviews.value.length / PAGE_SIZE));

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredReviews.value.slice(start, start + PAGE_SIZE);
});

watch([searchQuery, sentimentFilter], () => { currentPage.value = 1; });

const pendingCount = computed(() => reviews.value.filter(r => !r.managerReply).length);

// ── Reply modal ────────────────────────────────────────────────────────────────
const replyModalOpen = ref(false);
const selectedReview = ref<EstablishmentReview | null>(null);

const openReply = (review: EstablishmentReview) => {
  selectedReview.value = review;
  replyModalOpen.value = true;
};

const handleReplySent = (payload: { reviewId: string; reply: string }) => {
  const rev = reviews.value.find(r => r.id === payload.reviewId);
  if (rev) { rev.managerReply = payload.reply; rev.managerReplyAt = new Date().toISOString(); }
  replyModalOpen.value = false;
  selectedReview.value = null;
};

// ── Fetch ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const all = await ReviewService.getEstablishments();
    const mine = all.find(e => e.managerId === authStore.user?.id);
    if (!mine?.slug) {
      error.value = 'No tienes un establecimiento asignado. Contacta al administrador.';
      return;
    }
    est.value = mine;
    const result = await ReviewService.getEstablishmentReviews(mine.slug, 1, 500);
    reviews.value = result.data;
  } catch {
    error.value = 'Error al cargar las reseñas.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="w-full max-w-5xl mx-auto px-6 lg:px-12 py-12">

    <!-- Header -->
    <div class="mb-8">
      <p class="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">Portal del Gerente</p>
      <h1 class="text-4xl font-black tracking-tight text-white brand">
        Reseñas
        <span v-if="est" class="text-orange-500"> — {{ est.name }}</span>
      </h1>
      <p class="text-[#adaaad] mt-2 text-sm">
        {{ reviews.length }} reseñas en total
        <span v-if="pendingCount > 0" class="ml-2 inline-flex items-center gap-1 text-orange-400 font-semibold">
          <span class="material-symbols-outlined text-sm">pending</span>
          {{ pendingCount }} sin responder
        </span>
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-36 bg-white/5 rounded-3xl animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span class="material-symbols-outlined text-5xl text-[#adaaad]/40" style="font-variation-settings: 'FILL' 1;">error</span>
      <p class="text-[#adaaad] text-sm max-w-xs">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#adaaad] text-base pointer-events-none">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por comentario o estudiante..."
            class="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#adaaad] focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="opt in sentimentOptions"
            :key="opt.key"
            @click="sentimentFilter = opt.key"
            class="px-3 py-2 rounded-xl text-xs font-bold border transition-colors"
            :class="sentimentFilter === opt.key
              ? opt.key === 'positive' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : opt.key === 'negative' ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : opt.key === 'neutral'  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'bg-orange-500/20 border-orange-500/50 text-orange-400'
              : 'bg-white/5 border-white/10 text-[#adaaad] hover:border-white/20 hover:text-white'"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="filteredReviews.length === 0" class="text-center py-20 bg-white/5 rounded-3xl">
        <span class="material-symbols-outlined text-5xl text-[#adaaad]/30 block mb-3" style="font-variation-settings: 'FILL' 1;">rate_review</span>
        <p class="text-[#adaaad] text-sm">
          {{ reviews.length === 0 ? 'Tu establecimiento aún no tiene reseñas.' : 'No hay reseñas que coincidan con los filtros.' }}
        </p>
        <button v-if="searchQuery || sentimentFilter !== 'all'" @click="searchQuery = ''; sentimentFilter = 'all'" class="mt-3 text-xs text-orange-400 hover:text-orange-300 underline">
          Limpiar filtros
        </button>
      </div>

      <!-- List -->
      <div v-else class="space-y-4">
        <div v-for="review in paginatedReviews" :key="review.id" class="relative">
          <ReviewCard
            :review="review"
            :show-author="true"
            :show-sentiment="true"
            :clickable-image="false"
            :show-like="false"
          />
          <!-- Reply button / existing reply indicator -->
          <div class="mt-2 flex justify-end px-1">
            <button
              v-if="!review.managerReply"
              @click="openReply(review)"
              class="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-500/10"
            >
              <span class="material-symbols-outlined text-sm">reply</span>
              Responder
            </button>
            <span v-else class="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5">
              <span class="material-symbols-outlined text-sm">check_circle</span>
              Respondida
            </span>
          </div>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:current-page="currentPage = $event"
          class="mt-8"
        />
      </div>
    </template>

    <!-- Reply Modal -->
    <ManagerReplyModal
      :is-open="replyModalOpen"
      :review="selectedReview"
      @close="replyModalOpen = false; selectedReview = null"
      @sent="handleReplySent"
    />
  </div>
</template>
