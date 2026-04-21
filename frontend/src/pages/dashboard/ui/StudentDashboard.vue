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
            <h1 class="text-5xl md:text-7xl font-extrabold text-[#0e0e10] tracking-tighter leading-tight mb-4 brand animate-appear delay-100">
                Bienvenido, {{ firstName }}.<br/>
                <span class="text-orange-500">¿Tienes hambre?</span>
            </h1>
            <p class="text-[#525155] text-lg font-bold max-w-md mb-8 animate-appear delay-200">
                Tu voz define el estándar. Evalúa los servicios del campus y exige la calidad que la comunidad Anáhuac merece.
            </p>
            <div class="animate-appear delay-300">
                <RouterLink
                    to="/establishments"
                    class="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-200 active:scale-95">
                    Evaluar ahora
                </RouterLink>
            </div>
        </div>
    </section>

    <!-- Establishments Grid Section -->
    <section class="px-8 md:px-12 pb-24 w-full">
        <div class="flex justify-between items-end mb-10 border-b border-[#48474a]/15 pb-4">
            <div>
                <h2 class="text-3xl font-bold tracking-tight text-white mb-2 brand">Establecimientos</h2>
                <p class="text-[#adaaad]">Establecimientos de la Universidad Anáhuac Oaxaca</p>
            </div>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loadingEstablishments" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 4" :key="i" class="rounded-3xl overflow-hidden animate-pulse bg-surface-variant h-80"></div>
        </div>

        <!-- 2×2 Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
                v-for="(est, index) in establishments"
                :key="est.id"
                @click="navigateToEstablishment(est.slug!)"
                class="group cursor-pointer relative h-80 rounded-3xl overflow-hidden shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(249,115,22,0.3)] bg-surface-variant animate-appear"
                :style="{ animationDelay: `${400 + (index * 150)}ms` }"
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
                <div class="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                <!-- Text -->
                <div class="absolute bottom-0 left-0 right-0 p-6">
                    <div class="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1 drop-shadow-md">{{ est.category }}</div>
                    <h3 class="text-2xl font-bold text-white brand mb-1 drop-shadow-md">{{ est.name }}</h3>
                    <p class="text-white/90 text-sm line-clamp-2 drop-shadow-md font-medium">{{ est.description }}</p>
                </div>
            </div>
        </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes appearUp {
  0% { opacity: 0; transform: translateY(30px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-appear {
  opacity: 0; /* Starts hidden until animation kicks in */
  animation: appearUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
</style>
