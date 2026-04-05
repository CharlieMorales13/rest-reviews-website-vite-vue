<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const establishmentId = route.params.id;

// Mock data based on the design
const est = ref({
  id: establishmentId,
  name: 'DelyFull',
  category: 'Restaurante',
  hours: '08:00 AM - 08:00 PM',
  ige: { overall: 4.8, food: 4.8, service: 4.4, price: 4.0 },
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6clKxCZ5iEysudHs5GEY0Q1XGsUsvAPbudtum2Gh_JIxls6gy5l4Dkxs5Pm_PisuOuMmNAFjMjKIf6U1Vh3_tsgsZt_3sq0fU7mhGU60cfBi0y7aJoG4dEtRe5gS7Y1Pn3uq8gpYIh4tiCQgP-CVNWa_2NDtTf7SpfKkMWvNASJpw9n8A53GYmr-gzL2odIRPvZBfm-ZH6e4RIa8JFR79btTp1gAK2t5CqBOc7mm9LsvFmBJtWG0B0ZygIo1beQR9ItSxTYvECYtD',
  galleryImages: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ],
  menuImages: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1626074353765-517a681e40b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  reviews: [
    {
      id: 1, user: 'Maria S.', avatar: 'M', text: 'Me encantó la atención y los chilaquiles verdes tienen un picor excelente. Recomendado.', stars: 5, isManagerReplied: true, managerReply: '¡Hola Maria! Qué gusto saber que disfrutaste tus chilaquiles. Te esperamos pronto.'
    },
    {
      id: 2, user: 'Carlos M.', avatar: 'C', text: 'El sándwich de pollo estaba muy bueno. Precio accesible para estudiantes pero el café podría mejorar.', stars: 4, isManagerReplied: false
    }
  ]
});

const goToReview = () => {
  router.push(`/review/create/${establishmentId}`);
};
</script>

<template>
  <div class="w-full mx-auto animate-fade-in relative z-10">
    
    <!-- Hero Header -->
    <div class="relative w-full h-[50vh] min-h-[400px]">
      <div class="absolute inset-0 bg-[#0e0e10]/40 z-10"></div>
      <img :src="est.image" class="absolute inset-0 w-full h-full object-cover" />
      
      <!-- Back Button -->
      <button @click="router.back()" class="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-[#0e0e10]/60 hover:bg-[#0e0e10]/80 backdrop-blur-md rounded-full text-white transition-colors border border-[#48474a]/30">
        <span class="material-symbols-outlined text-sm">arrow_back</span>
        Regresar
      </button>

      <!-- Info Card over Image (Stitch Aesthetic) -->
      <div class="absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-4xl card-cream p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-black/5">
        <div>
          <span class="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold uppercase rounded-full border border-orange-500/20 tracking-wider">
            {{ est.category }}
          </span>
          <h2 class="text-4xl font-extrabold text-[#0e0e10] mt-3 brand">{{ est.name }}</h2>
          <p class="text-[#525155] flex items-center gap-2 mt-2 font-medium">
            <span class="material-symbols-outlined text-sm">schedule</span>
            Abierto: {{ est.hours }}
          </p>
        </div>

        <div class="flex gap-4">
          <div class="flex flex-col items-center p-3 bg-white rounded-xl border border-black/5 shadow-sm min-w-20">
            <span class="text-xl font-bold text-[#0e0e10]">{{ est.ige.food }}</span>
            <span class="text-[10px] text-[#adaaad] uppercase font-bold tracking-widest">Comida</span>
          </div>
          <div class="flex flex-col items-center p-3 bg-white rounded-xl border border-black/5 shadow-sm min-w-20">
            <span class="text-xl font-bold text-[#0e0e10]">{{ est.ige.service }}</span>
            <span class="text-[10px] text-[#adaaad] uppercase font-bold tracking-widest">Servicio</span>
          </div>
          <div class="flex flex-col items-center p-3 rounded-xl border border-orange-500/20 bg-orange-500/10 min-w-24 shadow-sm">
            <span class="text-2xl font-black text-orange-500">{{ est.ige.overall }}</span>
            <span class="text-[10px] text-orange-500 uppercase font-bold tracking-widest">IGE Total</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content below Hero -->
    <div class="max-w-4xl mx-auto px-6 mt-28 mb-16 space-y-12">
      
      <!-- Call To Action -->
      <div class="flex justify-center my-8">
        <button @click="goToReview" class="w-full md:w-2/3 py-5 text-xl tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined font-bold">edit_square</span>
          Escribir una Reseña
        </button>
      </div>

      <!-- Imágenes Separadas: Galería y Menú -->
      
      <!-- Galería -->
      <section v-if="est.galleryImages && est.galleryImages.length > 0">
        <h3 class="text-2xl font-bold text-white mb-6 brand">Galería del Establecimiento</h3>
        <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
          <div v-for="(img, idx) in est.galleryImages" :key="'g'+idx" class="shrink-0 w-72 h-48 rounded-2xl overflow-hidden snap-center border border-[#48474a]/15 shadow-lg">
            <img :src="img" class="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer" />
          </div>
        </div>
      </section>

      <!-- Menú -->
      <section v-if="est.menuImages && est.menuImages.length > 0">
        <h3 class="text-2xl font-bold text-white mb-6 brand">Menú y Carta</h3>
        <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
          <div v-for="(img, idx) in est.menuImages" :key="'m'+idx" class="shrink-0 w-64 h-80 rounded-2xl overflow-hidden snap-center border border-[#48474a]/15 shadow-lg bg-surface-container-high relative group">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
              <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
            </div>
            <img :src="img" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer z-0 relative" />
          </div>
        </div>
      </section>

      <!-- Reviews Feed (Stitch Aesthetic) -->
      <section>
        <h3 class="text-2xl font-bold text-white mb-6 brand">Reseñas de la Comunidad</h3>
        <div class="space-y-6">
          <article v-for="rev in est.reviews" :key="rev.id" class="card-cream p-8 rounded-[2rem] shadow-xl text-[#3f3f42]">
            <div class="flex justify-between items-start mb-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold font-headline shadow-sm">
                  {{ rev.avatar }}
                </div>
                <div>
                  <h4 class="font-bold text-[#0e0e10] text-lg leading-none brand">{{ rev.user }}</h4>
                </div>
              </div>
              <div class="flex gap-0.5 text-orange-500">
                <span v-for="n in 5" :key="n" class="material-symbols-outlined text-sm" :style="{ fontVariationSettings: `'FILL' ${n <= rev.stars ? 1 : 0}` }">star</span>
              </div>
            </div>
            
            <p class="text-[#3f3f42] font-medium leading-relaxed font-sans">{{ rev.text }}</p>

            <!-- Manager Reply -->
            <div v-if="rev.isManagerReplied" class="mt-6 relative pl-6">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-full"></div>
                <div class="bg-orange-500/5 rounded-2xl p-5 border border-orange-500/10">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-orange-500 text-sm">reply</span>
                        <span class="text-xs font-bold uppercase tracking-wider text-orange-500 brand">Respuesta Oficial</span>
                    </div>
                    <p class="text-[#3f3f42] text-sm italic leading-relaxed font-sans">
                        "{{ rev.managerReply }}"
                    </p>
                </div>
            </div>

          </article>
        </div>
      </section>

    </div>
  </div>
</template>
