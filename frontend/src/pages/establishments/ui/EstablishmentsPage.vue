<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { Establishment } from '@/entities/review/model/types';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import Icon from '@/shared/ui/Icon.vue';

const establishments = ref<Establishment[]>([]);
const loading = ref(true);
const errorMsg = ref<string | null>(null);
const router = useRouter();
const authStore = useAuthStore();

const fetchEstablishments = async () => {
  loading.value = true;
  errorMsg.value = null;
  try {
    const result = await ReviewService.getEstablishments();
    establishments.value = result;
  } catch {
    errorMsg.value = 'No se pudieron cargar los establecimientos.';
    establishments.value = [
      { id: '1', slug: 'delyfull', name: 'DelyFull', category: 'Restaurante' },
      { id: '2', slug: 'guajaquenito', name: 'Guajaquenito', category: 'Restaurante' },
      { id: '3', slug: 'cuckoo-coffee-resto', name: 'Cuckoo Coffee & Resto', category: 'Cafetería' },
      { id: '4', slug: 'cuckoo-box', name: 'Cuckoo Box', category: 'Cafetería' },
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEstablishments);

const goToReview = (slug: string) => {
  router.push({ name: 'create-review', params: { slug } });
};

const goToDetails = (slug: string) => {
  router.push({ name: 'establishment-details', params: { slug } });
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl md:text-4xl font-black tracking-tight text-white brand mb-2 animate-appear">
        Establecimientos
      </h1>
      <p class="text-[#adaaad] text-sm animate-appear delay-100">de la Universidad Anáhuac Oaxaca.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="rounded-3xl overflow-hidden animate-pulse bg-surface-variant h-80"></div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="flex flex-col items-center py-16 text-center animate-appear">
      <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <Icon name="error" class="text-red-400" />
      </div>
      <p class="text-[#adaaad] mb-4 text-sm">{{ errorMsg }}</p>
      <button
        @click="fetchEstablishments"
        class="px-5 py-2 border border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-sm font-semibold transition-all"
      >
        Reintentar
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="(est, index) in establishments"
        :key="est.id"
        class="group relative h-80 rounded-3xl overflow-hidden shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(249,115,22,0.3)] bg-surface-variant animate-appear"
        :style="{ animationDelay: `${200 + (index * 150)}ms` }"
      >
        <!-- Background Image -->
        <img
          v-if="est.coverUrl || est.galleryUrls?.[0]"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          :src="est.coverUrl || est.galleryUrls?.[0]"
          :alt="est.name"
          loading="lazy"
        />
        <div v-else class="absolute inset-0 flex items-center justify-center bg-white/5 text-[#adaaad]">
          <Icon name="restaurant" :size="64" />
        </div>

        <!-- Overlays -->
        <div class="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

        <!-- Content Area -->
        <div class="absolute inset-0 p-6 flex flex-col justify-between z-10 pointer-events-none">
          
          <!-- Top area: category -->
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1 drop-shadow-md block">
                {{ est.category }}
              </span>
              <h2 class="text-2xl font-bold text-white brand leading-tight drop-shadow-lg">{{ est.name }}</h2>
            </div>
          </div>

          <!-- Bottom area: desc & buttons -->
          <div>
            <p v-if="est.description" class="text-white/90 text-sm line-clamp-2 mb-5 drop-shadow-md font-medium">
              {{ est.description }}
            </p>
            <div class="flex gap-3 pointer-events-auto relative z-20">
              <button
                @click="goToDetails(est.slug!)"
                class="flex-1 py-3 text-sm font-semibold text-white/90 hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md bg-black/30 hover:bg-black/50 rounded-xl transition-all"
              >
                Ver Detalles
              </button>
              <button
                v-if="authStore.user?.role === 'student'"
                @click="goToReview(est.slug!)"
                class="flex-1 py-3 text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-all active:scale-95 shadow-[0_8px_20px_rgba(249,115,22,0.25)]"
              >
                Evaluar
              </button>
            </div>
          </div>
        </div>

        <!-- Background clickable area -->
        <div class="absolute inset-0 z-0 cursor-pointer" @click="goToDetails(est.slug!)"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes appearUp {
  0% { opacity: 0; transform: translateY(30px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-appear {
  opacity: 0;
  animation: appearUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.delay-100 { animation-delay: 100ms; }
</style>
