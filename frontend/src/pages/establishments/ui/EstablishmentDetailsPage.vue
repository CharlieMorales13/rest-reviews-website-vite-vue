<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import { PostService } from '@/entities/post/api/PostService';
import { extractErrorMessage } from '@/shared/lib/extractError';
import ReviewCard from '@/shared/ui/ReviewCard.vue';
import ReviewLightbox from '@/shared/ui/ReviewLightbox.vue';
import type { Establishment, EstablishmentReview } from '@/entities/review/model/types';
import type { EstablishmentPost } from '@/entities/post/model/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const slug = route.params.slug as string;

const est = ref<Establishment | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabKey = 'feed' | 'menu' | 'gallery' | 'reviews';
const activeTab = ref<TabKey>('feed');
const tabs: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'feed',    label: 'Feed' },
  { key: 'menu',    label: 'Menú' },
  { key: 'gallery', label: 'Galería' },
  { key: 'reviews', label: 'Reseñas' },
];

// ── Posts ─────────────────────────────────────────────────────────────────────
const posts = ref<EstablishmentPost[]>([]);
const postsLoading = ref(false);

const loadPosts = async () => {
  postsLoading.value = true;
  try {
    const result = await PostService.getPosts(slug, 1, 20);
    posts.value = result.data;
  } catch {
    posts.value = [];
  } finally {
    postsLoading.value = false;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Reviews ───────────────────────────────────────────────────────────────────
const reviews = ref<EstablishmentReview[]>([]);
const reviewsLoading = ref(false);
const totalReviews = ref(0);
const PAGE_SIZE = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(totalReviews.value / PAGE_SIZE));

const loadReviews = async (page: number) => {
  reviewsLoading.value = true;
  try {
    const result = await ReviewService.getEstablishmentReviews(slug, page, PAGE_SIZE);
    reviews.value = result.data;
    totalReviews.value = result.total;
    currentPage.value = page;
    if (page > 1) window.scrollTo({ top: window.innerHeight * 0.4, behavior: 'smooth' });
  } catch {
    reviews.value = [];
  } finally {
    reviewsLoading.value = false;
  }
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
const lightboxOpen = ref(false);
const lightboxIdx = ref(0);

const lightboxItems = computed(() =>
  reviews.value
    .filter(r => r.imageUrl)
    .map(r => ({ url: r.imageUrl!, comment: r.comment ?? null, author: r.author }))
);

const openLightbox = (reviewId: string) => {
  const index = lightboxItems.value.findIndex(
    (_, i) => reviews.value.filter(r => r.imageUrl)[i]?.id === reviewId
  );
  if (index >= 0) {
    lightboxIdx.value = index;
    lightboxOpen.value = true;
  }
};

// ── IGE ───────────────────────────────────────────────────────────────────────
const ige = computed(() => {
  if (!est.value) return '–';
  const aF = est.value.avgFoodScore || 0;
  const aS = est.value.avgServiceScore || 0;
  const aP = est.value.avgPriceScore || 0;
  if (!aF && !aS && !aP) return '–';
  return ((aF * 0.5 + aS * 0.3 + aP * 0.2) * 20).toFixed(1);
});

// ── Init ──────────────────────────────────────────────────────────────────────
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80';

onMounted(async () => {
  try {
    est.value = await ReviewService.getEstablishment(slug);
    loadPosts();
    loadReviews(1);
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'No se pudo cargar el establecimiento.');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="w-full animate-fade-in">

    <!-- Error -->
    <div v-if="error" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span class="material-symbols-outlined text-5xl text-red-400 block">error</span>
      <p class="text-on-surface-variant text-sm">{{ error }}</p>
    </div>

    <!-- Skeleton -->
    <div v-else-if="loading" class="space-y-6">
      <div class="w-full h-[450px] bg-surface-container animate-pulse"></div>
      <div class="max-w-[1280px] mx-auto px-8 md:px-16 space-y-4 mt-20">
        <div class="h-16 bg-surface-container rounded-2xl w-1/3 animate-pulse"></div>
        <div class="h-4 bg-surface-container rounded w-1/2 animate-pulse"></div>
      </div>
    </div>

    <template v-else-if="est">

      <!-- ═══════════════════ COVER + LOGO ═══════════════════ -->
      <div class="relative w-full h-[450px]">
        <img :src="est.coverUrl || est.galleryUrls?.[0] || FALLBACK_COVER" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

        <!-- Botón regresar -->
        <button
          @click="router.back()"
          class="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-surface-container-high/70 hover:bg-surface-container-high backdrop-blur-md rounded-full text-on-surface transition-colors border border-outline-variant/20"
        >
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Regresar
        </button>

        <!-- Logo circular -->
        <div class="absolute -bottom-16 left-8 md:left-16">
          <div class="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-background bg-surface-container-high overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div v-if="!est.logoUrl" class="w-full h-full flex items-center justify-center bg-surface-container-highest">
              <span class="text-4xl font-black font-headline text-primary">{{ est.name?.[0] }}</span>
            </div>
            <img v-else :src="est.logoUrl" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- ═══════════════════ NAME + ACCIONES ═══════════════════ -->
      <div class="max-w-[1280px] mx-auto px-8 md:px-16 mt-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl md:text-6xl font-black font-headline tracking-tighter text-on-surface">
            {{ est.name }}
          </h1>
          <div class="flex flex-wrap items-center gap-4 mt-3">
            <span v-if="est.category" class="px-3 py-1 bg-primary/10 text-primary text-xs font-black uppercase rounded-full border border-primary/20 tracking-wider font-headline">
              {{ est.category }}
            </span>
            <span v-if="ige !== '–'" class="flex items-center gap-1.5 text-sm text-on-surface-variant font-body">
              <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="font-bold text-on-surface">IGE {{ ige }}</span>
              <span class="text-xs text-on-surface-variant/70">/ 100</span>
            </span>
          </div>
        </div>

        <!-- CTA escribir reseña -->
        <button
          v-if="authStore.user?.role === 'student'"
          @click="router.push(`/review/create/${slug}`)"
          class="flex-shrink-0 bg-gradient-to-r from-[#ff9153] to-[#ff7a23] text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-widest shadow-[0_4px_12px_rgba(255,145,83,0.2)] active:scale-95 transition-transform"
        >
          Escribir una reseña
        </button>
      </div>

      <!-- ═══════════════════ TABS ═══════════════════ -->
      <div class="mt-8 border-b border-outline-variant/10 bg-background sticky top-[80px] md:top-[112px] z-40">
        <div class="max-w-[1280px] mx-auto px-8 md:px-16 flex gap-10 overflow-x-auto no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="activeTab === tab.key
              ? 'pb-4 pt-4 text-primary border-b-2 border-primary font-headline font-bold text-sm uppercase tracking-widest whitespace-nowrap'
              : 'pb-4 pt-4 text-on-surface-variant hover:text-on-surface font-headline font-bold text-sm uppercase tracking-widest whitespace-nowrap transition-colors'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- ═══════════════════ MAIN GRID ═══════════════════ -->
      <div class="max-w-[1280px] mx-auto px-8 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        <!-- LEFT — About (siempre visible) -->
        <div class="lg:col-span-4 space-y-10">
          <section class="bg-surface-container-low p-8 rounded-3xl">
            <h3 class="text-xs uppercase tracking-[0.2em] font-black text-primary mb-4 font-headline">About the Kitchen</h3>
            <p class="text-on-surface-variant leading-relaxed mb-6 font-body">
              {{ est.description || 'Sin descripción disponible.' }}
            </p>
            <div class="space-y-3">
              <div v-if="est.openingHours" class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-primary text-base">schedule</span>
                <span class="text-on-surface-variant font-body">{{ est.openingHours }}</span>
              </div>
              <div v-if="est.locationDetails" class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-primary text-base">location_on</span>
                <span class="text-on-surface-variant font-body">{{ est.locationDetails }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT — Contenido por tab -->
        <div class="lg:col-span-8">

          <!-- Tab: Feed -->
          <template v-if="activeTab === 'feed'">
            <div v-if="postsLoading" class="space-y-5">
              <div v-for="i in 3" :key="i" class="h-48 bg-surface-container rounded-3xl animate-pulse"></div>
            </div>
            <div v-else-if="posts.length === 0" class="text-center py-20 bg-surface-container-low rounded-3xl">
              <span class="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3" style="font-variation-settings: 'FILL' 1;">campaign</span>
              <p class="text-on-surface-variant font-bold font-headline">Sin publicaciones aún</p>
              <p class="text-sm text-on-surface-variant/60 mt-1 font-body">El establecimiento no ha publicado novedades todavía.</p>
            </div>
            <div v-else class="space-y-8">
              <article
                v-for="post in posts"
                :key="post.id"
                class="bg-surface-container-high rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              >
                <!-- Imágenes del post -->
                <div v-if="post.imageUrls?.length" class="relative overflow-hidden group"
                  :class="post.imageUrls.length === 1 ? 'h-[320px]' : 'grid grid-cols-2 h-56'">
                  <div v-if="post.imageUrls.length === 1" class="h-full">
                    <img :src="post.imageUrls[0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent"></div>
                  </div>
                  <template v-else>
                    <img v-for="(url, i) in post.imageUrls" :key="i"
                      :src="url" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </template>
                </div>
                <!-- Contenido -->
                <div class="p-8">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">storefront</span>
                    </div>
                    <div>
                      <p class="font-bold text-on-surface font-headline text-sm leading-none">{{ est.name }}</p>
                      <p class="text-xs text-on-surface-variant mt-0.5 font-body">{{ formatDate(post.createdAt) }}</p>
                    </div>
                  </div>
                  <p class="text-on-surface-variant leading-relaxed whitespace-pre-line font-body">{{ post.content }}</p>
                </div>
              </article>
            </div>
          </template>

          <!-- Tab: Menú -->
          <template v-else-if="activeTab === 'menu'">
            <div v-if="!est.menuUrls?.length" class="text-center py-20 bg-surface-container-low rounded-3xl">
              <span class="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3" style="font-variation-settings: 'FILL' 1;">menu_book</span>
              <p class="text-on-surface-variant font-bold font-headline">Sin menú disponible</p>
            </div>
            <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="(url, i) in est.menuUrls"
                :key="i"
                class="relative rounded-2xl overflow-hidden group aspect-[3/4] bg-surface-container-high shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/10"
              >
                <img :src="url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span class="material-symbols-outlined text-on-surface text-3xl">zoom_in</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Tab: Galería -->
          <template v-else-if="activeTab === 'gallery'">
            <div v-if="!est.galleryUrls?.length" class="text-center py-20 bg-surface-container-low rounded-3xl">
              <span class="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3" style="font-variation-settings: 'FILL' 1;">photo_library</span>
              <p class="text-on-surface-variant font-bold font-headline">Sin fotos en la galería</p>
            </div>
            <div v-else class="grid grid-cols-3 gap-2">
              <div
                v-for="(url, i) in est.galleryUrls"
                :key="i"
                class="relative rounded-2xl overflow-hidden group aspect-square"
              >
                <img :src="url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
          </template>

          <!-- Tab: Reseñas -->
          <template v-else-if="activeTab === 'reviews'">
            <div v-if="reviewsLoading" class="space-y-5">
              <div v-for="i in 3" :key="i" class="h-40 bg-surface-container rounded-3xl animate-pulse"></div>
            </div>
            <div v-else>
              <div v-if="reviews.length === 0" class="text-center py-20 bg-surface-container-low rounded-3xl">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3" style="font-variation-settings: 'FILL' 1;">rate_review</span>
                <p class="text-on-surface-variant font-bold font-headline">Aún no hay reseñas</p>
                <p class="text-sm text-on-surface-variant/60 mt-1 font-body">¡Sé el primero en compartir tu experiencia!</p>
              </div>
              <div v-else class="space-y-6">
                <ReviewCard
                  v-for="rev in reviews"
                  :key="rev.id"
                  :review="rev"
                  :show-author="true"
                  :clickable-image="true"
                  @image-click="openLightbox"
                />
              </div>

              <!-- Paginación -->
              <div v-if="totalPages > 1" class="flex items-center justify-between mt-8">
                <button
                  :disabled="currentPage === 1 || reviewsLoading"
                  @click="loadReviews(currentPage - 1)"
                  class="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors font-headline"
                >
                  <span class="material-symbols-outlined" style="font-size:16px;">arrow_back_ios</span>
                  Anterior
                </button>
                <span class="text-sm text-on-surface-variant font-bold font-headline">{{ currentPage }} / {{ totalPages }}</span>
                <button
                  :disabled="currentPage === totalPages || reviewsLoading"
                  @click="loadReviews(currentPage + 1)"
                  class="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors font-headline"
                >
                  Siguiente
                  <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward_ios</span>
                </button>
              </div>
            </div>
          </template>

        </div>
      </div>

    </template>

    <ReviewLightbox
      v-model="lightboxOpen"
      :items="lightboxItems"
      :initial-index="lightboxIdx"
    />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
