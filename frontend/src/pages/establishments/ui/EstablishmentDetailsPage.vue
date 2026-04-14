<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import { PostService } from '@/entities/post/api/PostService';
import type { Establishment, EstablishmentReview } from '@/entities/review/model/types';
import type { EstablishmentPost } from '@/entities/post/model/types';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const establishmentSlug = route.params.slug as string;

const est = ref<Establishment | null>(null);
const reviews = ref<EstablishmentReview[]>([]);
const loading = ref(true);
const reviewsLoading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalReviews = ref(0);
const PAGE_SIZE = 10;
const totalPages = computed(() => Math.ceil(totalReviews.value / PAGE_SIZE));

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

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = 'feed' | 'reviews';
const activeTab = ref<Tab>('feed');

// ── Posts ─────────────────────────────────────────────────────────────────────
const posts = ref<EstablishmentPost[]>([]);
const postsLoading = ref(false);

const loadPosts = async () => {
  postsLoading.value = true;
  try {
    const result = await PostService.getPosts(establishmentSlug, 1, 20);
    posts.value = result.data;
  } catch {
    posts.value = [];
  } finally {
    postsLoading.value = false;
  }
};

const formatPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Reviews ───────────────────────────────────────────────────────────────────
const loadReviews = async (page: number) => {
  reviewsLoading.value = true;
  try {
    const result = await ReviewService.getEstablishmentReviews(establishmentSlug, page, PAGE_SIZE);
    reviews.value = result.data;
    totalReviews.value = result.total;
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    reviews.value = [];
  } finally {
    reviewsLoading.value = false;
  }
};

onMounted(async () => {
  try {
    const [establishment, reviewsResult] = await Promise.all([
      ReviewService.getEstablishment(establishmentSlug),
      ReviewService.getEstablishmentReviews(establishmentSlug, 1, PAGE_SIZE),
    ]);
    est.value = establishment;
    reviews.value = reviewsResult.data;
    totalReviews.value = reviewsResult.total;
    loadPosts();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'No se pudo cargar el establecimiento.';
  } finally {
    loading.value = false;
  }
});

const goToReview = () => {
  router.push(`/review/create/${establishmentSlug}`);
};

const initials = (name: string | null) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
interface LightboxItem { url: string; comment: string | null; author: string | null; }

const lightboxItems = computed<LightboxItem[]>(() =>
  reviews.value
    .filter(r => r.imageUrl)
    .map(r => ({ url: r.imageUrl!, comment: r.comment ?? null, author: r.author }))
);

const lightboxIdx = ref(0);
const lightboxOpen = ref(false);

const openLightbox = (reviewId: string) => {
  const idx = lightboxItems.value.findIndex(
    (_, i) => reviews.value.filter(r => r.imageUrl)[i]?.id === reviewId
  );
  lightboxIdx.value = idx >= 0 ? idx : 0;
  lightboxOpen.value = true;
};

const closeLightbox = () => { lightboxOpen.value = false; };
const prevImage = () => { lightboxIdx.value = (lightboxIdx.value - 1 + lightboxItems.value.length) % lightboxItems.value.length; };
const nextImage = () => { lightboxIdx.value = (lightboxIdx.value + 1) % lightboxItems.value.length; };

const onKeydown = (e: KeyboardEvent) => {
  if (!lightboxOpen.value) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
};
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
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
      <div class="max-w-4xl mx-auto px-6 mt-28 mb-16 space-y-10">

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

        <!-- ── Tabs ─────────────────────────────────────────────────────────── -->
        <div>
          <!-- Tab bar -->
          <div class="flex gap-1 p-1 bg-white/5 rounded-2xl mb-8 border border-white/10 w-fit">
            <button
              @click="activeTab = 'feed'"
              class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              :class="activeTab === 'feed'
                ? 'bg-white text-[#0e0e10] shadow-sm'
                : 'text-[#adaaad] hover:text-white'"
            >
              <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">campaign</span>
              Feed
              <span v-if="posts.length > 0" class="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">{{ posts.length }}</span>
            </button>
            <button
              @click="activeTab = 'reviews'"
              class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              :class="activeTab === 'reviews'
                ? 'bg-white text-[#0e0e10] shadow-sm'
                : 'text-[#adaaad] hover:text-white'"
            >
              <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">rate_review</span>
              Reseñas
              <span v-if="totalReviews > 0" class="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">{{ totalReviews }}</span>
            </button>
          </div>

          <!-- ── Tab: Feed ─────────────────────────────────────────────────── -->
          <section v-show="activeTab === 'feed'">
            <div v-if="postsLoading" class="space-y-5">
              <div v-for="i in 3" :key="i" class="h-40 bg-white/5 rounded-3xl animate-pulse"></div>
            </div>

            <div v-else-if="posts.length === 0" class="card-cream p-12 rounded-3xl text-center border border-dashed border-black/10">
              <span class="material-symbols-outlined text-5xl text-[#adaaad] mb-3 block" style="font-variation-settings: 'FILL' 1;">campaign</span>
              <p class="text-[#525155] font-bold">Sin publicaciones aún</p>
              <p class="text-sm text-[#adaaad] mt-1">El establecimiento no ha publicado novedades todavía.</p>
            </div>

            <div v-else class="space-y-6">
              <article
                v-for="post in posts"
                :key="post.id"
                class="card-cream rounded-3xl shadow-md border border-black/5 overflow-hidden"
              >
                <!-- Post header -->
                <div class="flex items-center gap-3 px-6 pt-6 pb-4">
                  <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-orange-500 text-lg" style="font-variation-settings: 'FILL' 1;">storefront</span>
                  </div>
                  <div>
                    <p class="font-bold text-[#0e0e10] brand leading-none">{{ est.name }}</p>
                    <p class="text-xs text-[#adaaad] mt-0.5">{{ formatPostDate(post.createdAt) }}</p>
                  </div>
                </div>

                <!-- Post content -->
                <p class="text-[#3f3f42] leading-relaxed whitespace-pre-line px-6 pb-4">{{ post.content }}</p>

                <!-- Post images -->
                <div
                  v-if="post.imageUrls && post.imageUrls.length > 0"
                  class="grid gap-0.5"
                  :class="{
                    'grid-cols-1': post.imageUrls.length === 1,
                    'grid-cols-2': post.imageUrls.length === 2,
                    'grid-cols-2': post.imageUrls.length === 3,
                    'grid-cols-2': post.imageUrls.length === 4,
                  }"
                >
                  <img
                    v-for="(url, i) in post.imageUrls"
                    :key="i"
                    :src="url"
                    class="w-full object-cover"
                    :class="{
                      'max-h-96': post.imageUrls.length === 1,
                      'h-56': post.imageUrls.length >= 2,
                      'rounded-bl-3xl': post.imageUrls.length === 3 && i === 1,
                    }"
                  />
                </div>

                <div class="h-2"></div>
              </article>
            </div>
          </section>

          <!-- ── Tab: Reseñas ──────────────────────────────────────────────── -->
          <section v-show="activeTab === 'reviews'">
            <!-- CTA -->
            <div v-if="authStore.user?.role === 'student'" class="flex justify-center mb-8">
              <button
                @click="goToReview"
                class="w-full md:w-2/3 py-5 text-xl tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined font-bold">edit_square</span>
                Escribir una Reseña
              </button>
            </div>

            <div v-if="reviews.length === 0 && !reviewsLoading" class="card-cream p-10 rounded-3xl text-center text-[#adaaad]">
              Aún no hay reseñas para este establecimiento. ¡Sé el primero!
            </div>

            <div v-if="reviewsLoading" class="space-y-6">
              <div v-for="i in 3" :key="i" class="h-40 bg-white/5 rounded-3xl animate-pulse"></div>
            </div>

            <div v-else class="space-y-6">
              <article v-for="rev in reviews" :key="rev.id" class="card-cream p-8 rounded-[2rem] shadow-xl text-[#3f3f42]">
                <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold font-headline shadow-sm">
                      {{ initials(rev.author) }}
                    </div>
                    <div>
                      <h4 class="font-bold text-[#0e0e10] text-lg leading-none brand">{{ rev.author || 'Estudiante' }}</h4>
                      <p class="text-xs text-orange-500 font-semibold mt-0.5" v-if="rev.authorCarrera">{{ rev.authorCarrera }} · UAO</p>
                      <p class="text-xs text-[#adaaad] mt-0.5">{{ new Date(rev.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
                    </div>
                  </div>
                  <div class="flex gap-0.5 text-orange-500">
                    <span v-for="n in 5" :key="n" class="material-symbols-outlined text-sm" :style="{ fontVariationSettings: `'FILL' ${n <= rev.foodScore ? 1 : 0}` }">star</span>
                  </div>
                </div>

                <p v-if="rev.comment" class="text-[#3f3f42] font-medium leading-relaxed font-sans">{{ rev.comment }}</p>

                <div v-if="rev.imageUrl" class="mt-4">
                  <img
                    :src="rev.imageUrl"
                    class="w-full max-h-64 object-cover rounded-2xl cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md border border-black/5"
                    @click="openLightbox(rev.id)"
                    alt="Evidencia de la reseña"
                  />
                </div>

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

            <!-- Paginación -->
            <div v-if="totalPages > 1" class="flex items-center justify-between mt-8">
              <button
                :disabled="currentPage === 1 || reviewsLoading"
                @click="loadReviews(currentPage - 1)"
                class="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-white border border-black/10 text-sm font-bold text-[#0e0e10] disabled:opacity-40 hover:bg-black/5 transition-colors shadow-sm"
              >
                <span class="material-symbols-outlined" style="font-size:16px;">arrow_back_ios</span>
                Anterior
              </button>
              <span class="text-sm text-[#adaaad] font-bold">{{ currentPage }} / {{ totalPages }}</span>
              <button
                :disabled="currentPage === totalPages || reviewsLoading"
                @click="loadReviews(currentPage + 1)"
                class="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-white border border-black/10 text-sm font-bold text-[#0e0e10] disabled:opacity-40 hover:bg-black/5 transition-colors shadow-sm"
              >
                Siguiente
                <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward_ios</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lb">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[200] flex items-center justify-center"
          @click.self="closeLightbox"
        >
          <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeLightbox"></div>

          <div class="relative z-10 w-full max-w-3xl mx-4 flex flex-col items-center gap-4">
            <button
              @click="closeLightbox"
              class="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <span class="material-symbols-outlined">close</span>
            </button>

            <div class="relative w-full">
              <img
                :src="lightboxItems[lightboxIdx]?.url"
                class="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                alt="Evidencia de reseña"
              />
              <button
                v-if="lightboxItems.length > 1"
                @click.stop="prevImage"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                <span class="material-symbols-outlined">arrow_back_ios</span>
              </button>
              <button
                v-if="lightboxItems.length > 1"
                @click.stop="nextImage"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                <span class="material-symbols-outlined">arrow_forward_ios</span>
              </button>
            </div>

            <div class="w-full bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-white">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-bold text-orange-400">{{ lightboxItems[lightboxIdx]?.author || 'Estudiante' }}</span>
                <span v-if="lightboxItems.length > 1" class="text-xs text-white/50">{{ lightboxIdx + 1 }} / {{ lightboxItems.length }}</span>
              </div>
              <p v-if="lightboxItems[lightboxIdx]?.comment" class="text-sm text-white/80 leading-relaxed">
                {{ lightboxItems[lightboxIdx].comment }}
              </p>
              <p v-else class="text-sm text-white/40 italic">Sin comentario adicional</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lb-enter-active, .lb-leave-active { transition: opacity 0.2s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }
</style>
