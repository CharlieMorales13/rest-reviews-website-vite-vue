<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';

const router = useRouter();
const authStore = useAuthStore();
const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'León');

// Mock Data matching Stitch
const establishments = ref([
  { id: '1', name: 'DelyFull', category: 'Restaurante', rating: 4.8, description: 'Comida saludable y antojitos 100% oaxaqueños (tlayudas, tacos, opciones veganas).', location: 'Campus Norte', img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: '2', name: 'Guajaquenito', category: 'Restaurante', rating: 4.5, description: 'El corazón de Oaxaca en cada bocado. Molotes, memelas y recetas tradicionales.', location: 'Patio de Comidas', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: '3', name: 'Cuckoo Coffee & Resto', category: 'Cafetería', rating: 4.2, description: 'Especialistas en café, chilaquiles y desayunos perfectos para acompañar tus horas de estudio.', location: 'Ala de Biblioteca', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: '4', name: 'Cuckoo Box', category: 'Cafetería', rating: 3.9, description: 'Comida rápida para llevar: Hamburguesas, tortas y opciones listas para comer entre clases.', location: 'Centro Deportivo', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
]);

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
            <img class="w-full h-full object-cover opacity-90" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"/>
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

        <!-- Bento-style Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                        <div class="absolute top-4 right-4 bg-orange-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-md">
                            {{ est.rating.toFixed(1) }} IGE
                        </div>
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
