<script setup lang="ts">
import { ref } from 'vue';
import ManagerReplyModal from './ManagerReplyModal.vue';

// Mock Data
const placeName = ref("DelyFull");

const metrics = ref([
  { id: '1', title: 'Índice de Gastronomía Estudiantil (IGE)', value: '4.8', max: '/ 5.0', icon: 'restaurant', color: 'orange-500' },
  { id: '2', title: 'Calidad de Alimentos', value: '92', max: '%', icon: 'thumb_up', color: 'emerald-500' },
  { id: '3', title: 'Servicio y Atención', value: '4.5', max: '/ 5.0', icon: 'person', color: 'blue-500' },
  { id: '4', title: 'Relación Precio-Calidad', value: '4.2', max: '/ 5.0', icon: 'payments', color: 'purple-500' },
]);

const pendingReviews = ref([
  {
    id: 'r1',
    author: 'Mateo Rivera',
    date: 'Hace 2 días',
    rating: 4.5,
    content: 'Increíble atención. Las chilaquiles verdes estaban en su punto exacto de picor. Sin duda, la mejor opción para desayunar entre clases pesadas.',
    status: 'pending'
  },
  {
    id: 'r2',
    author: 'Ana García',
    date: 'Hace 5 días',
    rating: 3.0,
    content: 'La comida es buena, pero tardaron más de 20 minutos en entregarme un agua de sabor.',
    status: 'pending'
  }
]);

const isReplyModalOpen = ref(false);
const selectedReview = ref<any>(null);

const openReplyModal = (review: any) => {
  selectedReview.value = review;
  isReplyModalOpen.value = true;
};

const handleSendReply = (payload: { reviewId: string, message: string }) => {
  console.log("Sending reply for review", payload.reviewId, ":", payload.message);
  const rev = pendingReviews.value.find(r => r.id === payload.reviewId);
  if (rev) {
    rev.status = 'replied';
  }
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-fade-in relative">
    
    <!-- Hero Header -->
    <header class="mb-12">
      <div class="flex items-center gap-3 mb-2">
        <span class="material-symbols-outlined text-orange-500">storefront</span>
        <span class="text-orange-500 font-bold tracking-widest uppercase text-sm">Portal del Gerente</span>
      </div>
      <h1 class="text-4xl lg:text-5xl font-black text-white brand tracking-tight">
        Panel de Control: <span class="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">{{ placeName }}</span>
      </h1>
      <p class="text-[#adaaad] mt-4 max-w-2xl text-lg">
        Analiza el rendimiento de tu establecimiento y conecta con nuestros leones mediante respuestas oficiales.
      </p>
    </header>

    <!-- Metrics Grid -->
    <section class="mb-16">
      <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Métricas Globales</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="metric in metrics" 
          :key="metric.id"
          class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-transform"
        >
          <!-- Background Glow Effect for Hover -->
          <div :class="`absolute -top-10 -right-10 w-24 h-24 bg-${metric.color}/10 rounded-full blur-2xl group-hover:bg-${metric.color}/20 transition-colors`"></div>
          
          <div :class="`w-12 h-12 rounded-xl bg-white border border-${metric.color}/20 text-${metric.color} flex items-center justify-center shadow-sm`">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">{{ metric.icon }}</span>
          </div>
          <div>
            <h3 class="text-[#525155] text-sm font-bold mb-1 uppercase">{{ metric.title }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-[#0e0e10] brand">{{ metric.value }}</span>
              <span class="text-sm font-semibold text-[#8e8d91]">{{ metric.max }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Management -->
    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold tracking-tight text-white brand">Reseñas Pendientes de Respuesta</h2>
        <span class="bg-orange-500/20 text-orange-500 font-bold px-3 py-1 rounded-full text-sm">
          {{ pendingReviews.filter(r => r.status === 'pending').length }} pendientes
        </span>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <div 
          v-for="review in pendingReviews" 
          :key="review.id"
          class="card-cream rounded-[1.5rem] p-6 shadow-sm border border-outline-variant/10"
        >
          <div class="flex justify-between items-start flex-col sm:flex-row gap-4 mb-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                {{ review.author.charAt(0) }}
              </div>
              <div>
                <p class="font-bold text-[#0e0e10] brand">{{ review.author }}</p>
                <p class="text-xs text-[#adaaad]">{{ review.date }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
              <span class="material-symbols-outlined text-orange-500 text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="font-bold text-[#0e0e10] text-sm">{{ review.rating.toFixed(1) }}</span>
            </div>
          </div>
          
          <p class="text-[#3f3f42] mb-6">"{{ review.content }}"</p>
          
          <div class="flex justify-end">
            <button 
              v-if="review.status === 'pending'"
              @click="openReplyModal(review)"
              class="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <span class="material-symbols-outlined text-sm">reply</span>
              Responder
            </button>
            <div v-else class="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-lg">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              Respuesta enviada
            </div>
          </div>
        </div>

        <div v-if="pendingReviews.filter((r: any) => r.status === 'pending').length === 0" class="text-center py-12 card-cream rounded-[1.5rem] border border-dashed border-outline-variant/20">
          <span class="material-symbols-outlined text-5xl text-[#adaaad] mb-2">done_all</span>
          <p class="text-[#525155] font-bold">¡Todo al día!</p>
          <p class="text-sm text-[#adaaad]">No hay reseñas pendientes de respuesta.</p>
        </div>
      </div>
    </section>

    <ManagerReplyModal 
      :isOpen="isReplyModalOpen"
      :review="selectedReview"
      @close="isReplyModalOpen = false"
      @send="handleSendReply"
    />
  </div>
</template>
