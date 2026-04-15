<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import Icon from '@/shared/ui/Icon.vue';

const router = useRouter();
const authStore = useAuthStore();
const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'Estudiante');


interface EstablishmentCard {
  id: string;
  slug: string;
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
    establishments.value = data.map((e) => ({
      id: e.id,
      slug: e.slug || e.id,
      name: e.name,
      category: e.category || 'Establecimiento',
      description: e.description || 'Disfruta de una experiencia gastronómica única en el campus Anáhuac Oaxaca.',
      location: e.locationDetails || 'Campus Anáhuac Oaxaca',
      img: e.coverUrl || e.galleryUrls?.[0] || '',
    }));
  } catch {
    // Si falla la API, la grid queda vacía — el error se ve claramente
  } finally {
    loadingEstablishments.value = false;
  }
});

const navigateToEstablishment = (slug: string) => {
  router.push(`/establishments/${slug}`);
};
</script>

<template>
  <div class="w-full">
    <!-- Welcome Banner -->
    <section class="relative w-full h-[520px] md:h-[550px] flex items-center overflow-hidden mb-12">
        <div class="absolute inset-0 bg-[#ffffff]"></div>
        <div class="absolute right-0 top-0 w-3/5 h-full">
            <div class="relative w-full h-full">
                <img class="w-full h-full object-cover" src="/assets/images/ANAHUAC-1-1160x700.jpg" alt="Campus Anáhuac Oaxaca"/>
                <div class="absolute inset-0 bg-gradient-to-r from-[#ffffff] via-[#FAF9F6]/30 to-transparent"></div>
            </div>
        </div>
        <div class="relative z-10 px-10 md:px-20 max-w-781">
            <h1 class="text-5xl md:text-7xl font-extrabold text-[#0e0e10] tracking-tighter leading-tight mb-4 brand">
                Bienvenido, {{ firstName }}.<br/>
                <span class="text-orange-500">¿Tienes hambre?</span>
            </h1>
            <p class="text-[#525155] text-lg font-bold max-w-md mb-8">
                Tu voz define el estándar. Evalúa los servicios del campus y exige la calidad que la comunidad Anáhuac merece.
            </p>
            <RouterLink
                to="/establishments"
                class="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-200 active:scale-95">
                Evaluar ahora
            </RouterLink>
        </div>
    </section>

    <!-- Establishments Grid Section -->
    <section class="px-8 md:px-12 pb-24 w-full">
        <div class="flex justify-between items-end mb-10 border-b border-[#48474a]/15 pb-4">
            <div>
                <h2 class="text-3xl font-bold tracking-tight text-white mb-2 brand">Establecimientos</h2>
                <p class="text-[#adaaad]">Establecimientos de la Universidad Anáhuac Oaxaca</p>
            </div>
            <div class="flex space-x-2">
                <button aria-label="Filtros" class="p-2 w-10 h-10 rounded-full border border-[#48474a]/40 hover:bg-surface-variant transition-colors flex items-center justify-center text-[#adaaad] hover:text-white">
                    <Icon name="tune" />
                </button>
            </div>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loadingEstablishments" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 4" :key="i" class="rounded-3xl overflow-hidden animate-pulse bg-surface-variant h-80"></div>
        </div>

        <!-- 2×2 Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
                v-for="est in establishments"
                :key="est.id"
                @click="navigateToEstablishment(est.slug!)"
                class="group cursor-pointer relative h-80 rounded-3xl overflow-hidden shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(249,115,22,0.2)] bg-surface-variant"
            >
                <!-- Cover image -->
                <img
                    v-if="est.img"
                    class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    :src="est.img"
                    :alt="est.name"
                    loading="lazy"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center text-[#adaaad]">
                    <Icon name="restaurant" :size="64" />
                </div>

                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <!-- Text -->
                <div class="absolute bottom-0 left-0 right-0 p-6">
                    <div class="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">{{ est.category }}</div>
                    <h3 class="text-2xl font-bold text-white brand mb-1">{{ est.name }}</h3>
                    <p class="text-white/70 text-sm line-clamp-2">{{ est.description }}</p>
                </div>
            </div>
        </div>
    </section>
  </div>
</template>
