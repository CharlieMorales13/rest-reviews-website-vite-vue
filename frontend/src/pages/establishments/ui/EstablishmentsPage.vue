<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { Establishment } from '@/entities/review/model/types';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';

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
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl md:text-4xl font-black tracking-tight text-white brand mb-2">
        Establecimientos
      </h1>
      <p class="text-[#adaaad] text-sm">Los 4 espacios gastronómicos del campus Anáhuac Oaxaca.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div v-for="i in 4" :key="i" class="bg-white/5 rounded-2xl p-6 animate-pulse">
        <div class="h-5 bg-white/10 rounded w-2/3 mb-3"></div>
        <div class="h-4 bg-white/10 rounded-full w-20 mb-6"></div>
        <div class="h-10 bg-white/10 rounded-xl w-full"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="flex flex-col items-center py-16 text-center">
      <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-red-400">error</span>
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
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div
        v-for="est in establishments"
        :key="est.id"
        class="group bg-white/5 hover:bg-white/8 border border-white/8 hover:border-orange-500/30 rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(255,145,83,0.12)]"
      >
        <!-- Card header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-orange-500/80 mb-1 block">
              {{ est.category }}
            </span>
            <h2 class="text-xl font-bold text-white brand leading-tight">{{ est.name }}</h2>
          </div>
          <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-orange-400 text-lg">storefront</span>
          </div>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6">
          <button
            @click="goToDetails(est.slug!)"
            class="flex-1 py-2.5 text-sm font-semibold text-[#adaaad] hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
          >
            Ver Detalles
          </button>
          <button
            v-if="authStore.user?.role === 'student'"
            @click="goToReview(est.slug!)"
            class="flex-1 py-2.5 text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors active:scale-95"
          >
            Evaluar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
