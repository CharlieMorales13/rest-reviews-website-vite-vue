<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';

const router = useRouter();
const authStore = useAuthStore();
const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'León');

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

interface EstablishmentCard {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  img: string;
}

const establishments = ref<EstablishmentCard[]>([]);
const loadingEstablishments = ref(true);

onMounted(async () => {
  try {
    const data = await ReviewService.getEstablishments();
    establishments.value = data.map((e, i) => ({
      id: e.id,
      name: e.name,
      category: e.category || 'Establecimiento',
      description: (e as any).description || 'Disfruta de una experiencia gastronómica única en el campus Anáhuac Oaxaca.',
      location: (e as any).locationDetails || 'Campus Anáhuac Oaxaca',
      img: ((e as any).galleryUrls as string[])?.[0] || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
    }));
  } catch {
    // Si falla la API, la grid queda vacía — el error se ve claramente
  } finally {
    loadingEstablishments.value = false;
  }
});

const navigateToEstablishment = (id: string) => {
  router.push(`/establishments/${id}`);
};
</script>

<template>
  <div class="w-full">
    <!-- Welcome Banner (Stitch HTML) -->
    <section class="relative w-full h-[400px] flex items-center overflow-hidden mb-12">
        <!-- Creamy Background Layer -->
        <div class="absolute inset-0 bg-[#FAF9F6]"></div>
        
        <!-- Atmospheric Imagery (Asymmetric Editorial Style) -->
        <div class="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
            <div class="relative w-full h-full">
            <img class="w-full h-full object-cover opacity-90" src="/assets/images/ANAHUAC-1-1160x700.jpg" alt="Campus Anáhuac Oaxaca"/>
            <div class="absolute inset-0 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/40 to-transparent"></div>
            </div>
        </div>
        
        <div class="relative z-10 px-12 md:px-24 max-w-4xl">
            <h1 class="text-5xl md:text-7xl font-extrabold text-[#0e0e10] tracking-tighter leading-tight mb-4 brand">
                Hola, {{ firstName }}.<br/>
                <span class="text-orange-500">¿Dónde comeremos hoy?</span>
            </h1>
            <p class="text-[#525155] text-lg font-medium max-w-md">
                Explora las mejores experiencias culinarias dentro de tu campus. Calidad, sabor y comunidad en un solo lugar.
            </p>
        </div>
    </section>

    <!-- Establishments Grid Section -->
    <section class="px-8 md:px-12 pb-24 w-full">
        <div class="flex justify-between items-end mb-10 border-b border-[#48474a]/15 pb-4">
            <div>
                <h2 class="text-3xl font-bold tracking-tight text-white mb-2 brand">Gastronomía del Campus</h2>
                <p class="text-[#adaaad]">Establecimientos mejor calificados para nuestros Leones.</p>
            </div>
            <div class="flex space-x-2">
                <button class="p-2 w-10 h-10 rounded-full border border-[#48474a]/40 hover:bg-surface-variant transition-colors flex items-center justify-center text-[#adaaad] hover:text-white">
                    <span class="material-symbols-outlined">tune</span>
                </button>
            </div>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loadingEstablishments" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div v-for="i in 4" :key="i" class="card-cream rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div class="h-56 bg-black/10"></div>
                <div class="p-6 space-y-3">
                    <div class="h-3 bg-black/10 rounded w-1/3"></div>
                    <div class="h-5 bg-black/10 rounded w-2/3"></div>
                    <div class="h-3 bg-black/10 rounded w-full"></div>
                </div>
            </div>
        </div>

        <!-- Bento-style Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
                v-for="est in establishments"
                :key="est.id"
                @click="navigateToEstablishment(est.id)"
                class="group cursor-pointer"
            >
                <div class="card-cream rounded-2xl overflow-hidden shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)]">
                    <div class="relative h-56 overflow-hidden">
                        <img
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            :src="est.img"
                        />
                    </div>
                    <div class="p-6">
                        <div class="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">{{ est.category }}</div>
                        <h3 class="text-2xl font-bold text-[#0e0e10] mb-1 brand">{{ est.name }}</h3>
                        <p class="text-[#525155] text-sm line-clamp-2 h-10">{{ est.description }}</p>
                        <div class="mt-4 flex items-center text-[#3f3f42] text-xs font-semibold">
                            <span class="material-symbols-outlined text-sm mr-1">location_on</span> {{ est.location }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  </div>
</template>
