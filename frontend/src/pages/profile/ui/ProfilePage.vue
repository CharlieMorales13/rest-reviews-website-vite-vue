<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { MyReview } from '@/entities/review/model/types';
import EditProfileModal from './EditProfileModal.vue';
import ChangePasswordModal from './ChangePasswordModal.vue';
import ReviewCard from '@/shared/ui/ReviewCard.vue';

const authStore = useAuthStore();
const reviews = ref<MyReview[]>([]);
const reviewCount = ref<number | null>(null);

const filterEstablishment = ref('');
const filterMinScore = ref(0);
const filterOrder = ref<'newest' | 'oldest'>('newest');
const showFilterPanel = ref(false);

const totalLikes = computed(() =>
  reviews.value.reduce((sum, r) => sum + (r.likesCount ?? 0), 0),
);

const uniqueEstablishments = computed(() => {
  const names = reviews.value.map((r) => r.establishmentName).filter((n): n is string => !!n);
  return [...new Set(names)];
});

const uniqueEstablishmentCount = computed(() => new Set(reviews.value.map((r) => r.establishmentId)).size);

const filteredReviews = computed(() => {
  let result = [...reviews.value];
  if (filterEstablishment.value)
    result = result.filter((r) => r.establishmentName === filterEstablishment.value);
  if (filterMinScore.value > 0)
    result = result.filter((r) => (r.foodScore + r.serviceScore + r.priceScore) / 3 >= filterMinScore.value);
  result = result.sort((a, b) =>
    filterOrder.value === 'oldest'
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return result.slice(0, 5);
});

const hasActiveFilters = computed(
  () => filterEstablishment.value !== '' || filterMinScore.value > 0 || filterOrder.value !== 'newest',
);

const clearFilters = () => {
  filterEstablishment.value = '';
  filterMinScore.value = 0;
  filterOrder.value = 'newest';
};

onMounted(async () => {
  authStore.fetchProfile();
  try {
    const myReviews = await ReviewService.getMyReviews();
    reviews.value = myReviews;
    reviewCount.value = myReviews.length;
  } catch {
    reviewCount.value = 0;
  }
});

const userName = computed(() => authStore.user?.name || 'Cargando...');
const userBio = computed(() => authStore.user?.bio || null);
const userAvatar = computed(() => authStore.user?.avatarUrl || null);
const userCarrera = computed(() => authStore.user?.carrera || null);
const userInitials = computed(() => {
  const parts = userName.value.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] || '') + (parts[1][0] || '');
  return (parts[0] || '').substring(0, 2).toUpperCase();
});

const isEditModalOpen = ref(false);
const isChangePasswordOpen = ref(false);
</script>

<template>
  <div class="w-full text-on-surface antialiased pt-6 mb-20 animate-fade-in">
    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6">
      
      <!-- Profile Header Section -->
      <section class="mb-12">
        <div class="flex flex-col md:flex-row items-center md:items-end gap-8">
          
          <div class="relative">
            <div class="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-primary/20 shadow-2xl bg-surface-variant flex items-center justify-center">
              <img 
                 v-if="userAvatar" 
                 :src="userAvatar" 
                 alt="Profile avatar" 
                 class="w-full h-full object-cover" 
              />
              <span v-else class="text-4xl font-headline font-black text-primary">{{ userInitials }}</span>
            </div>
            
            <button @click="isEditModalOpen = true" class="absolute -bottom-2 -right-2 p-2 bg-surface-bright rounded-full border border-outline-variant shadow-lg text-primary hover:text-primary-fixed transition-colors">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">edit</span>
            </button>
          </div>

          <div class="flex-1 text-center md:text-left">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">{{ userName }}</h2>
                <p class="text-primary font-headline font-medium tracking-wide mt-1">
                  {{ userCarrera ? userCarrera + ' • Anáhuac' : 'Estudiante Anáhuac' }}
                </p>
                <p v-if="userBio" class="text-on-surface-variant text-sm mt-2 max-w-sm leading-relaxed mx-auto md:mx-0">
                  {{ userBio }}
                </p>
              </div>
              <div class="flex items-center gap-2 justify-center md:justify-start">
                  <button @click="isEditModalOpen = true" class="px-6 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95">
                      Editar Perfil
                  </button>
                  <button @click="isChangePasswordOpen = true" aria-label="Cambiar Contraseña" class="p-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-error/10 hover:text-error transition-all active:scale-95">
                      <span class="material-symbols-outlined text-xl leading-none block">lock</span>
                  </button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-12 py-6 border-y border-outline-variant/15">
          <div class="text-center">
            <span class="block text-2xl font-headline font-black text-on-surface">{{ reviewCount !== null ? reviewCount : '...' }}</span>
            <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Reseñas</span>
          </div>
          <div class="text-center border-x border-outline-variant/15">
            <span data-testid="total-likes" class="block text-2xl font-headline font-black text-on-surface">{{ totalLikes }}</span>
            <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Likes</span>
          </div>
          <div class="text-center">
            <span class="block text-2xl font-headline font-black text-on-surface">{{ uniqueEstablishmentCount || '—' }}</span>
            <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Establecimientos</span>
          </div>
        </div>
      </section>

      <!-- Review Feed Section (Static for now) -->
      <section>
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-2xl font-headline font-bold text-[#f9f5f8]">Mis Reseñas Históricas</h3>
          <div class="relative">
            <button
              class="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
              :class="{ 'text-primary': hasActiveFilters }"
              @click="showFilterPanel = !showFilterPanel"
            >
              <span class="material-symbols-outlined">filter_list</span>
            </button>
            <div v-show="showFilterPanel" class="absolute right-0 mt-2 w-64 bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-xl p-4 z-10 space-y-4">
              <div>
                <label class="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Establecimiento</label>
                <select data-testid="filter-establishment" v-model="filterEstablishment"
                  class="w-full bg-surface-variant text-on-surface rounded-lg px-3 py-2 text-sm border border-outline-variant/20">
                  <option value="">Todos</option>
                  <option v-for="name in uniqueEstablishments" :key="name" :value="name">{{ name }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Calificación mínima</label>
                <select v-model.number="filterMinScore"
                  class="w-full bg-surface-variant text-on-surface rounded-lg px-3 py-2 text-sm border border-outline-variant/20">
                  <option :value="0">Cualquiera</option>
                  <option :value="1">1+ estrella</option>
                  <option :value="2">2+ estrellas</option>
                  <option :value="3">3+ estrellas</option>
                  <option :value="4">4+ estrellas</option>
                  <option :value="5">5 estrellas</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Orden</label>
                <select v-model="filterOrder"
                  class="w-full bg-surface-variant text-on-surface rounded-lg px-3 py-2 text-sm border border-outline-variant/20">
                  <option value="newest">Más reciente</option>
                  <option value="oldest">Más antiguo</option>
                </select>
              </div>
              <button v-if="hasActiveFilters" @click="clearFilters"
                class="w-full text-xs text-on-surface-variant hover:text-error transition-colors">
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <ReviewCard
            v-for="rev in filteredReviews"
            :key="rev.id"
            data-testid="review-card"
            :review="rev"
            :show-author="false"
            :show-establishment="true"
            :show-sentiment="true"
            :show-like="false"
          />

          <div v-if="reviews.length === 0" class="text-center py-10 bg-surface-variant/30 rounded-3xl border border-white/5">
            <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">rate_review</span>
            <p class="text-on-surface-variant">Aún no has escrito ninguna reseña.</p>
            <RouterLink to="/establishments" class="inline-block mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all">
                Evaluar ahora
            </RouterLink>
          </div>

          <div v-else-if="reviews.length > 0" class="text-center mt-8">
            <RouterLink to="/my-reviews" class="inline-flex items-center gap-2 px-6 py-3 border border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-white/30 rounded-xl transition-colors font-medium">
              Ver todas en Mis Reseñas
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </RouterLink>
          </div>
        </div>
      </section>

    </main>

    <!-- Modals -->
    <ChangePasswordModal
      :isOpen="isChangePasswordOpen"
      @close="isChangePasswordOpen = false"
    />

    <EditProfileModal
      :isOpen="isEditModalOpen"
      :initialName="userName"
      :initialBio="userBio ?? undefined"
      :initialCarrera="userCarrera"
      :initialAvatarUrl="authStore.user?.avatarUrl"
      @close="isEditModalOpen = false"
      @saved="isEditModalOpen = false"
    />
  </div>
</template>

<style scoped>
.glass-card {
  background: rgba(249, 245, 248, 0.95);
  backdrop-filter: blur(10px);
}
</style>
