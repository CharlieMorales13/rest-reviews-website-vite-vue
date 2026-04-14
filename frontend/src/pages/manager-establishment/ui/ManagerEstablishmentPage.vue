<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { uploadImage } from '@/shared/api/uploadImage';
import { ReviewService } from '@/entities/review/api/ReviewService';
import { PostService } from '@/entities/post/api/PostService';
import { EstablishmentService } from '@/entities/establishment/api/EstablishmentService';
import { useAuthStore } from '@/entities/user/model/authStore';
import ReviewCard from '@/shared/ui/ReviewCard.vue';
import type { Establishment, EstablishmentReview } from '@/entities/review/model/types';
import type { EstablishmentPost } from '@/entities/post/model/types';
import CreatePostModal from '@/features/create-post/ui/CreatePostModal.vue';
import ManagerReplyModal from '@/pages/dashboard/ui/ManagerReplyModal.vue';

const authStore = useAuthStore();

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80';

// ── State ──────────────────────────────────────────────────────────────────────
const est = ref<Establishment | null>(null);
const posts = ref<EstablishmentPost[]>([]);
const reviews = ref<EstablishmentReview[]>([]);
const loading = ref(true);
const reviewsLoading = ref(false);
const error = ref<string | null>(null);

type TabKey = 'feed' | 'menu' | 'gallery' | 'reviews';
const activeTab = ref<TabKey>('feed');
const tabs: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'feed', label: 'Feed' },
  { key: 'menu', label: 'Menú' },
  { key: 'gallery', label: 'Galería' },
  { key: 'reviews', label: 'Reseñas' },
];

// Pagination - reviews
const reviewPage = ref(1);
const reviewTotal = ref(0);
const REVIEW_PAGE_SIZE = 10;

// Pagination - posts
const postPage = ref(1);
const postTotal = ref(0);
const POST_PAGE_SIZE = 10;
const totalPostPages = computed(() => Math.ceil(postTotal.value / POST_PAGE_SIZE));

// Search - reviews
const searchQuery = ref('');
const searchDate = ref('');
const filteredReviews = computed(() => {
  let list = reviews.value;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) list = list.filter(r => r.comment?.toLowerCase().includes(q) || r.author?.toLowerCase().includes(q));
  if (searchDate.value) list = list.filter(r => r.createdAt.startsWith(searchDate.value));
  return list;
});
const paginatedReviews = computed(() => {
  const start = (reviewPage.value - 1) * REVIEW_PAGE_SIZE;
  return filteredReviews.value.slice(start, start + REVIEW_PAGE_SIZE);
});
watch([searchQuery, searchDate], () => { reviewPage.value = 1; });
const clearSearch = () => { searchQuery.value = ''; searchDate.value = ''; };

// ── Fetch ──────────────────────────────────────────────────────────────────────
const fetchAll = async () => {
  loading.value = true;
  error.value = null;
  try {
    const all = await ReviewService.getEstablishments();
    const mine = all.find(e => e.managerId === authStore.user?.id);
    if (!mine) {
      error.value = 'No tienes un establecimiento asignado. Contacta al administrador.';
      return;
    }
    est.value = mine;
    await Promise.all([loadPosts(mine.slug!), loadReviews(mine.slug!)]);
  } catch {
    error.value = 'Error al cargar el establecimiento.';
  } finally {
    loading.value = false;
  }
};

const loadPosts = async (slug: string, page = 1) => {
  const result = await PostService.getPosts(slug, page, POST_PAGE_SIZE);
  posts.value = result.data;
  postTotal.value = result.total;
  postPage.value = page;
};

const loadReviews = async (slug: string) => {
  reviewsLoading.value = true;
  try {
    const result = await ReviewService.getEstablishmentReviews(slug, 1, 200);
    reviews.value = result.data;
    reviewTotal.value = result.total;
  } finally {
    reviewsLoading.value = false;
  }
};

onMounted(fetchAll);

// ── IGE ────────────────────────────────────────────────────────────────────────
const ige = computed(() => {
  if (!est.value) return '–';
  const aF = est.value.avgFoodScore || 0;
  const aS = est.value.avgServiceScore || 0;
  const aP = est.value.avgPriceScore || 0;
  if (!aF && !aS && !aP) return '–';
  return ((aF * 0.5 + aS * 0.3 + aP * 0.2) * 20).toFixed(1);
});



// ── Cover + Logo upload ────────────────────────────────────────────────────────
const coverInput = ref<HTMLInputElement | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);
const coverUploading = ref(false);
const logoUploading = ref(false);

const triggerCoverUpload = () => coverInput.value?.click();
const triggerLogoUpload = () => logoInput.value?.click();

const onCoverSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !est.value) return;
  target.value = '';
  coverUploading.value = true;
  try {
    const url = await uploadImage(file);
    await EstablishmentService.update(est.value.id, { coverUrl: url });
    est.value = { ...est.value, coverUrl: url };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    if (msg) alert(msg);
  } finally {
    coverUploading.value = false;
  }
};

const onLogoSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !est.value) return;
  target.value = '';
  logoUploading.value = true;
  try {
    const url = await uploadImage(file);
    await EstablishmentService.update(est.value.id, { logoUrl: url });
    est.value = { ...est.value, logoUrl: url };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    if (msg) alert(msg);
  } finally {
    logoUploading.value = false;
  }
};

// ── Gallery ────────────────────────────────────────────────────────────────────
const galleryInput = ref<HTMLInputElement | null>(null);
const galleryUploading = ref(false);
const triggerGalleryUpload = () => galleryInput.value?.click();

const onGalleryImageSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !est.value) return;
  target.value = '';
  galleryUploading.value = true;
  try {
    const url = await uploadImage(file);
    const newUrls = [...(est.value.galleryUrls || []), url];
    await EstablishmentService.update(est.value.id, { galleryUrls: newUrls });
    est.value = { ...est.value, galleryUrls: newUrls };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    if (msg) alert(msg);
  } finally {
    galleryUploading.value = false;
  }
};

const removeGalleryImage = async (index: number) => {
  if (!est.value) return;
  const newUrls = (est.value.galleryUrls || []).filter((_, i) => i !== index);
  await EstablishmentService.update(est.value.id, { galleryUrls: newUrls });
  est.value = { ...est.value, galleryUrls: newUrls };
};

// ── Menu ───────────────────────────────────────────────────────────────────────
const menuInput = ref<HTMLInputElement | null>(null);
const menuUploading = ref(false);
const triggerMenuUpload = () => menuInput.value?.click();

const onMenuImageSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !est.value) return;
  target.value = '';
  menuUploading.value = true;
  try {
    const url = await uploadImage(file);
    const newUrls = [...(est.value.menuUrls || []), url];
    await EstablishmentService.update(est.value.id, { menuUrls: newUrls });
    est.value = { ...est.value, menuUrls: newUrls };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    if (msg) alert(msg);
  } finally {
    menuUploading.value = false;
  }
};

const removeMenuImage = async (index: number) => {
  if (!est.value) return;
  const newUrls = (est.value.menuUrls || []).filter((_, i) => i !== index);
  await EstablishmentService.update(est.value.id, { menuUrls: newUrls });
  est.value = { ...est.value, menuUrls: newUrls };
};

// ── Posts actions ──────────────────────────────────────────────────────────────
const postModalOpen = ref(false);
const editingPost = ref<EstablishmentPost | null>(null);

const openCreatePost = () => { editingPost.value = null; postModalOpen.value = true; };
const openEditPost = (post: EstablishmentPost) => { editingPost.value = post; postModalOpen.value = true; };

const onPostCreated = (post: EstablishmentPost) => {
  posts.value.unshift(post);
  postTotal.value++;
  postModalOpen.value = false;
};

const onPostUpdated = (updated: EstablishmentPost) => {
  const idx = posts.value.findIndex(p => p.id === updated.id);
  if (idx !== -1) posts.value[idx] = { ...posts.value[idx], ...updated };
  postModalOpen.value = false;
  editingPost.value = null;
};

const deletePost = async (postId: string) => {
  if (!est.value?.slug || !confirm('¿Eliminar esta publicación?')) return;
  await PostService.deletePost(est.value.slug, postId);
  posts.value = posts.value.filter(p => p.id !== postId);
  postTotal.value--;
};

// ── About edit ─────────────────────────────────────────────────────────────────
const aboutEditOpen = ref(false);
const aboutSaving = ref(false);
const aboutForm = ref({ description: '', openingHours: '', locationDetails: '' });

const openAboutEdit = () => {
  aboutForm.value = {
    description: est.value?.description ?? '',
    openingHours: est.value?.openingHours ?? '',
    locationDetails: est.value?.locationDetails ?? '',
  };
  aboutEditOpen.value = true;
};

const saveAbout = async () => {
  if (!est.value) return;
  aboutSaving.value = true;
  try {
    await EstablishmentService.update(est.value.id, { ...aboutForm.value });
    est.value = { ...est.value, ...aboutForm.value };
    aboutEditOpen.value = false;
  } finally {
    aboutSaving.value = false;
  }
};

// ── Reply modal ────────────────────────────────────────────────────────────────
const replyModalOpen = ref(false);
const selectedReview = ref<EstablishmentReview | null>(null);

const openReplyModal = (review: EstablishmentReview) => { selectedReview.value = review; replyModalOpen.value = true; };
const handleReplySent = (updated: { reviewId: string; reply: string }) => {
  const rev = reviews.value.find(r => r.id === updated.reviewId);
  if (rev) { rev.managerReply = updated.reply; rev.managerReplyAt = new Date().toISOString(); }
  replyModalOpen.value = false;
  selectedReview.value = null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const pendingCount = computed(() => reviews.value.filter(r => !r.managerReply).length);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<template>
  <div class="w-full animate-fade-in">
    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="w-full h-[450px] bg-surface-container animate-pulse"></div>
      <div class="max-w-[1280px] mx-auto px-8 md:px-16 space-y-4 mt-20">
        <div class="h-16 bg-surface-container rounded-2xl w-1/3 animate-pulse"></div>
        <div class="h-4 bg-surface-container rounded w-1/2 animate-pulse"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span class="material-symbols-outlined text-5xl text-primary" style="font-variation-settings: 'FILL' 1;">store_mall_directory</span>
      <h2 class="text-xl font-black text-on-surface font-headline">Sin establecimiento asignado</h2>
      <p class="text-on-surface-variant text-sm">{{ error }}</p>
    </div>

    <template v-else-if="est">
      <!-- ═══════════════════ COVER + LOGO ═══════════════════ -->
      <div class="relative w-full h-[450px]">
        <img :src="est.coverUrl || FALLBACK_COVER" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

        <div v-if="coverUploading" class="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <button
          @click="triggerCoverUpload"
          class="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2 bg-surface-container-high/80 backdrop-blur-md rounded-xl text-on-surface hover:bg-surface-bright transition-all border border-outline-variant/20"
        >
          <span class="material-symbols-outlined text-base">camera_alt</span>
          <span class="text-xs font-bold font-headline uppercase tracking-widest">Cambiar portada</span>
        </button>
        <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverSelected" />

        <!-- Logo -->
        <div class="absolute -bottom-16 left-8 md:left-16">
          <div class="relative group w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-background bg-surface-container-high overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div v-if="!est.logoUrl" class="w-full h-full flex items-center justify-center bg-surface-container-highest">
              <span class="text-4xl font-black font-headline text-primary">{{ est.name?.[0] }}</span>
            </div>
            <img v-else :src="est.logoUrl" class="w-full h-full object-cover" />

            <div v-if="logoUploading" class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
              <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            <button
              @click="triggerLogoUpload"
              class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
            >
              <span class="material-symbols-outlined text-on-surface text-2xl">camera_alt</span>
            </button>
            <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoSelected" />
          </div>
        </div>
      </div>

      <!-- ═══════════════════ NAME + INFO ═══════════════════ -->
      <div class="max-w-[1280px] mx-auto px-8 md:px-16 mt-20">
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
        <!-- LEFT — About -->
        <div class="lg:col-span-4 space-y-10">
          <section class="bg-surface-container-low p-8 rounded-3xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs uppercase tracking-[0.2em] font-black text-primary font-headline">About the Kitchen</h3>
              <button
                @click="openAboutEdit"
                class="p-1.5 rounded-lg hover:bg-surface-bright transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
            </div>
            <p class="text-on-surface-variant leading-relaxed mb-6 font-body">
              {{ est.description || 'Sin descripción. Haz clic en editar para añadir una.' }}
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

        <!-- RIGHT — Tab content -->
        <div class="lg:col-span-8 space-y-8">
          <!-- ═══ FEED ═══ -->
          <template v-if="activeTab === 'feed'">
            <section>
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xs uppercase tracking-[0.2em] font-black text-on-surface font-headline">Publicaciones</h3>
                <button
                  @click="openCreatePost"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff9153] to-[#ff7a23] text-on-primary font-bold text-sm shadow-[0_4px_12px_rgba(255,145,83,0.2)] hover:brightness-110 active:scale-95 transition-all font-headline"
                >
                  <span class="material-symbols-outlined text-base">add</span>
                  Nueva publicación
                </button>
              </div>

              <div v-if="posts.length === 0" class="text-center py-12 bg-surface-container-low rounded-3xl">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-2">campaign</span>
                <p class="text-on-surface-variant font-bold font-headline">Sin publicaciones todavía</p>
                <p class="text-sm text-on-surface-variant/60 mt-1 font-body">Comparte novedades con tus estudiantes.</p>
              </div>

              <div v-else class="space-y-4">
                <div v-for="post in posts" :key="post.id" class="bg-surface-container-low rounded-3xl p-6">
                  <div class="flex justify-between items-start mb-3">
                    <p class="text-xs text-on-surface-variant font-body">{{ formatDate(post.createdAt) }}</p>
                    <div class="flex items-center gap-2">
                      <button @click="openEditPost(post)" class="text-on-surface-variant hover:text-on-surface transition-colors">
                        <span class="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button @click="deletePost(post.id)" class="text-on-surface-variant hover:text-red-400 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                  <p class="text-on-surface mb-4 whitespace-pre-wrap font-body">{{ post.content }}</p>
                  <div v-if="post.imageUrls?.length" class="grid gap-2" :class="post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
                    <img v-for="(url, i) in post.imageUrls" :key="i" :src="url" class="w-full rounded-2xl object-cover max-h-64" />
                  </div>
                </div>

                <div v-if="totalPostPages > 1" class="flex items-center justify-between pt-2">
                  <button
                    :disabled="postPage === 1"
                    @click="loadPosts(est!.slug!, postPage - 1)"
                    class="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-bright transition-colors font-headline"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">arrow_back_ios</span>
                    Anterior
                  </button>
                  <span class="text-sm text-on-surface-variant font-body">{{ postPage }} / {{ totalPostPages }}</span>
                  <button
                    :disabled="postPage === totalPostPages"
                    @click="loadPosts(est!.slug!, postPage + 1)"
                    class="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-bright transition-colors font-headline"
                  >
                    Siguiente
                    <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward_ios</span>
                  </button>
                </div>
              </div>
            </section>
          </template>

          <!-- ═══ MENU ═══ -->
          <template v-else-if="activeTab === 'menu'">
            <section>
              <div class="flex justify-between items-end mb-4">
                <h3 class="text-xs uppercase tracking-[0.2em] font-black text-on-surface font-headline">Menú</h3>
                <span v-if="menuUploading" class="text-xs text-on-surface-variant font-body">Subiendo…</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  v-for="(url, i) in est.menuUrls"
                  :key="i"
                  class="relative group rounded-2xl overflow-hidden aspect-[3/4] bg-surface-container"
                >
                  <img :src="url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button
                    @click="removeMenuImage(i)"
                    class="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <span class="material-symbols-outlined text-white" style="font-size:14px;">close</span>
                  </button>
                </div>
                <button
                  @click="triggerMenuUpload"
                  class="rounded-2xl aspect-[3/4] flex flex-col items-center justify-center bg-surface-container border border-outline-variant/20 border-dashed hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                >
                  <span class="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  <span class="text-xs font-bold font-headline mt-1">Agregar</span>
                </button>
                <input ref="menuInput" type="file" accept="image/*" class="hidden" @change="onMenuImageSelected" />
              </div>
            </section>
          </template>

          <!-- ═══ GALLERY ═══ -->
          <template v-else-if="activeTab === 'gallery'">
            <section>
              <div class="flex justify-between items-end mb-4">
                <h3 class="text-xs uppercase tracking-[0.2em] font-black text-on-surface font-headline">Gallery</h3>
                <span v-if="galleryUploading" class="text-xs text-on-surface-variant font-body">Subiendo…</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(url, i) in est.galleryUrls"
                  :key="i"
                  class="relative group rounded-2xl overflow-hidden aspect-square bg-surface-container"
                >
                  <img :src="url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button
                    @click="removeGalleryImage(i)"
                    class="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <span class="material-symbols-outlined text-white" style="font-size:14px;">close</span>
                  </button>
                </div>
                <button
                  @click="triggerGalleryUpload"
                  class="rounded-2xl aspect-square flex flex-col items-center justify-center bg-surface-container border border-outline-variant/20 border-dashed hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                >
                  <span class="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  <span class="text-xs font-bold font-headline mt-1">Agregar</span>
                </button>
                <input ref="galleryInput" type="file" accept="image/*" class="hidden" @change="onGalleryImageSelected" />
              </div>
            </section>
          </template>

          <!-- ═══ REVIEWS ═══ -->
          <template v-else-if="activeTab === 'reviews'">
            <section>
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xs uppercase tracking-[0.2em] font-black text-on-surface font-headline">Reseñas de Estudiantes</h3>
                <span v-if="pendingCount > 0" class="bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-xs font-headline">
                  {{ pendingCount }} sin responder
                </span>
                <span v-else class="bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 font-headline">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">done_all</span>
                  Todo respondido
                </span>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 mb-6">
                <div class="relative flex-1">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style="font-size:18px;">search</span>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Buscar por comentario o usuario..."
                    class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 font-body"
                  />
                </div>
                <input
                  v-model="searchDate"
                  type="date"
                  class="px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:border-primary/50 font-body"
                />
                <button
                  v-if="searchQuery || searchDate"
                  @click="clearSearch"
                  class="px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-sm font-bold text-on-surface-variant hover:bg-surface-bright transition-colors flex items-center gap-1 font-headline"
                >
                  <span class="material-symbols-outlined" style="font-size:16px;">close</span>
                  Limpiar
                </button>
              </div>

              <div v-if="reviewsLoading" class="space-y-4">
                <div v-for="i in 3" :key="i" class="h-36 bg-surface-container rounded-2xl animate-pulse"></div>
              </div>

              <div v-else-if="reviews.length === 0" class="text-center py-16 bg-surface-container-low rounded-3xl">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2 block">rate_review</span>
                <p class="text-on-surface-variant font-bold font-headline">Sin reseñas todavía</p>
              </div>

              <div v-else-if="filteredReviews.length === 0" class="text-center py-12 bg-surface-container-low rounded-3xl">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">search_off</span>
                <p class="text-on-surface-variant font-bold font-headline">Sin resultados</p>
              </div>

              <div v-else class="space-y-5">
                <ReviewCard
                  v-for="review in paginatedReviews"
                  :key="review.id"
                  :review="review"
                  :show-author="true"
                  :show-sentiment="true"
                >
                  <template #actions>
                    <div v-if="!review.managerReply" class="flex justify-end mt-4">
                      <button
                        @click.stop="openReplyModal(review)"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-on-primary text-primary font-bold text-sm transition-all border border-primary/30 hover:border-primary font-headline"
                      >
                        <span class="material-symbols-outlined text-sm">reply</span>
                        Responder
                      </button>
                    </div>
                  </template>
                </ReviewCard>

                <div v-if="Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE) > 1" class="flex items-center justify-between pt-4">
                  <button
                    :disabled="reviewPage === 1"
                    @click="reviewPage--"
                    class="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-bright transition-colors font-headline"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;">arrow_back_ios</span>
                    Anterior
                  </button>
                  <span class="text-sm text-on-surface-variant font-bold font-body">
                    Página {{ reviewPage }} de {{ Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE) }}
                    <span class="text-on-surface-variant/60 font-normal ml-1">({{ filteredReviews.length }})</span>
                  </span>
                  <button
                    :disabled="reviewPage === Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE)"
                    @click="reviewPage++"
                    class="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface disabled:opacity-40 hover:bg-surface-bright transition-colors font-headline"
                  >
                    Siguiente
                    <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward_ios</span>
                  </button>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>

      <!-- ═══════════════════ MODALS ═══════════════════ -->
      <CreatePostModal
        :isOpen="postModalOpen"
        :slug="est?.slug ?? ''"
        :editPost="editingPost"
        @close="postModalOpen = false; editingPost = null"
        @created="onPostCreated"
        @updated="onPostUpdated"
      />

      <ManagerReplyModal
        :isOpen="replyModalOpen"
        :review="selectedReview"
        @close="replyModalOpen = false; selectedReview = null"
        @sent="handleReplySent"
      />

      <!-- About edit panel -->
      <div v-if="aboutEditOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-xl" @click="aboutEditOpen = false"></div>
        <div class="relative w-full max-w-lg bg-surface-container rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/10 overflow-hidden">
          <div class="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
            <h3 class="text-lg font-black font-headline text-on-surface">Editar Perfil</h3>
            <button @click="aboutEditOpen = false" class="p-2 rounded-full hover:bg-surface-bright text-on-surface-variant">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="p-8 space-y-5">
            <div>
              <label class="text-xs font-black text-primary uppercase tracking-[0.15em] font-headline block mb-2">Descripción</label>
              <textarea
                v-model="aboutForm.description"
                rows="4"
                class="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 resize-none text-sm font-body"
              ></textarea>
            </div>
            <div>
              <label class="text-xs font-black text-primary uppercase tracking-[0.15em] font-headline block mb-2">Horario</label>
              <input
                v-model="aboutForm.openingHours"
                type="text"
                placeholder="Lun-Vie 8:00 – 20:00"
                class="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 text-sm font-body"
              />
            </div>
            <div>
              <label class="text-xs font-black text-primary uppercase tracking-[0.15em] font-headline block mb-2">Ubicación</label>
              <input
                v-model="aboutForm.locationDetails"
                type="text"
                placeholder="Edificio Central, Planta Baja"
                class="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 text-sm font-body"
              />
            </div>
          </div>
          <div class="px-8 py-5 border-t border-outline-variant/10 flex justify-end gap-3">
            <button
              @click="aboutEditOpen = false"
              class="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors font-headline"
            >
              Cancelar
            </button>
            <button
              @click="saveAbout"
              :disabled="aboutSaving"
              class="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#ff9153] to-[#ff7a23] text-on-primary shadow-[0_4px_12px_rgba(255,145,83,0.2)] hover:brightness-110 transition-all font-headline disabled:opacity-50"
            >
              {{ aboutSaving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
