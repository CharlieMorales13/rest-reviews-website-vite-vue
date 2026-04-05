<script setup lang="ts">
import { ref } from 'vue';

// Mocked historical reviews with photos
const reviews = ref([
  {
    id: '1',
    establishmentName: 'DelyFull',
    foodScore: 5,
    serviceScore: 4,
    priceScore: 4,
    comment: '¡El mejor lugar para comer entre clases! Siempre sirven bastante rápido.',
    createdAt: '2026-03-10',
    managerReply: null,
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    ]
  },
  {
    id: '2',
    establishmentName: 'Cuckoo Coffee & Resto',
    foodScore: 3,
    serviceScore: 5,
    priceScore: 3,
    comment: 'El café está muy rico pero considero que está un poco caro para ser de la uni.',
    createdAt: '2026-03-25',
    managerReply: 'Hola. Agradecemos tu retroalimentación. Siempre buscamos proveedores de café de especialidad de Oaxaca, pero tomaremos en cuenta tu comentario sobre los precios para futuros menús.',
    images: []
  }
]);

const computeIGE = (food: number, service: number, price: number) => {
  return ((food * 0.5 + service * 0.3 + price * 0.2)).toFixed(1);
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
    <h2 class="text-3xl font-extrabold text-white mb-2 text-center">Mis Reseñas</h2>
    <p class="text-white/50 text-center mb-10">Tus evaluaciones, fotos y respuestas de los gerentes.</p>
    
    <div v-if="reviews.length === 0" class="glass-effect rounded-3xl p-12 text-center text-white/50">
      Actualmente no tienes reseñas publicadas.
    </div>
    
    <div class="space-y-6">
      <div v-for="rev in reviews" :key="rev.id" class="glass-effect p-6 md:p-8 rounded-3xl shadow-lg border border-white/10 bg-[#12161D] transition-transform hover:-translate-y-1">
        
        <!-- Header: Rest Name & IGE -->
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 class="text-xl font-bold text-white">{{ rev.establishmentName }}</h3>
            <p class="text-white/40 text-xs mt-1">Escrita el {{ rev.createdAt }}</p>
          </div>
          
          <div class="flex gap-2.5">
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border border-white/5 w-16">
              <span class="text-white font-bold">{{ rev.foodScore }}</span>
              <span class="text-[9px] uppercase text-white/50 font-semibold tracking-wider">Comida</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border border-white/5 w-16">
              <span class="text-white font-bold">{{ rev.serviceScore }}</span>
              <span class="text-[9px] uppercase text-white/50 font-semibold tracking-wider">Servicio</span>
            </div>
            <div class="flex flex-col items-center justify-center p-2 rounded-lg bg-anahuac-orange/10 border border-anahuac-orange/20 w-16 shadow-[0_0_10px_rgba(255,121,0,0.1)]">
              <span class="text-anahuac-orange font-bold">{{ computeIGE(rev.foodScore, rev.serviceScore, rev.priceScore) }}</span>
              <span class="text-[9px] uppercase text-anahuac-orange font-semibold tracking-wider">IGE</span>
            </div>
          </div>
        </div>
        
        <!-- Review Body -->
        <div class="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
          <p class="text-white/80 leading-relaxed text-sm md:text-base">"{{ rev.comment }}"</p>
        </div>

        <!-- Photos -->
        <div v-if="rev.images && rev.images.length > 0" class="flex gap-4 mb-4 overflow-x-auto pb-2 snap-x">
          <div v-for="(img, idx) in rev.images" :key="idx" class="shrink-0 w-32 h-32 rounded-xl overflow-hidden snap-center border border-white/10 shadow-lg">
            <img :src="img" class="w-full h-full object-cover" />
          </div>
        </div>
        
        <!-- Manager Reply Block -->
        <div v-if="rev.managerReply" class="mt-4 p-5 rounded-2xl bg-anahuac-cream border border-anahuac-orange/30 shadow-inner relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-anahuac-orange"></div>
          
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-anahuac-orange flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </div>
            <span class="text-xs font-extrabold text-anahuac-orange uppercase tracking-wider">Respuesta del Gerente</span>
          </div>
          
          <p class="text-sm text-[#333] leading-relaxed ml-8">
            {{ rev.managerReply }}
          </p>
        </div>

      </div>
    </div>
  </div>
</template>
