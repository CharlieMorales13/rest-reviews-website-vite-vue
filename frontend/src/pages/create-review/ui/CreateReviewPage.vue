<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ReviewService } from '@/entities/review/api/ReviewService';

const route = useRoute();
const router = useRouter();
const establishmentId = route.params.id as string;

const establishmentName = ref('el Establecimiento');
onMounted(async () => {
  try {
    const establishments = await ReviewService.getEstablishments();
    const found = establishments.find(e => e.id === establishmentId);
    if (found) establishmentName.value = found.name;
  } catch {
    // fallback ya está en el valor por defecto
  }
});

const foodScore = ref(0);
const serviceScore = ref(0);
const priceScore = ref(0);
const comment = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const COMMENT_MAX = 500;
const commentLength = computed(() => comment.value.length);
const commentTooShort = computed(() => comment.value.length > 0 && comment.value.length < 10);

const allScoresValid = computed(() => foodScore.value > 0 && serviceScore.value > 0 && priceScore.value > 0);
const formValid = computed(() => allScoresValid.value && !loading.value && commentLength.value <= COMMENT_MAX && !commentTooShort.value);

// For mockup of drag & drop images
const uploadedImages = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelect = (e: any) => {
  const files = e.target.files;
  if (files.length) {
    // mock logic to show UI change
    uploadedImages.value.push(URL.createObjectURL(files[0]));
  }
};

const removeImage = (idx: number) => {
  uploadedImages.value.splice(idx, 1);
};

const submitReview = async () => {
  if (!formValid.value) return;
  loading.value = true;
  error.value = null;
  
  try {
    const response = await ReviewService.create({
      establishmentId,
      foodScore: foodScore.value,
      serviceScore: serviceScore.value,
      priceScore: priceScore.value,
      comment: comment.value || undefined
    });
    alert(response.message || '¡Evaluación enviada con éxito!');
    router.push(`/establishments/${establishmentId}`);
  } catch (e: any) {
    if (e.response?.status === 409) {
      error.value = 'Ya has enviado una reseña para este establecimiento anteriormente.';
    } else {
      error.value = e.response?.data?.message || 'Hubo un error al enviar tu evaluación.';
    }
  } finally {
    loading.value = false;
  }
};

const renderStars = (score: number, hoverScore: number, max = 5) => {
  const current = hoverScore || score;
  return Array.from({ length: max }, (_, i) => i + 1 <= current);
};

// UI handlers for stars
const hoveredFood = ref(0);
const hoveredService = ref(0);
const hoveredPrice = ref(0);
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center p-4 lg:p-8 animate-fade-in relative z-10 w-full">
    
    <div class="w-full max-w-2xl card-cream rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-black/5">
      <div class="h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>

      <div class="p-8 md:p-12">
        <div class="flex items-center gap-4 mb-8">
          <button @click="router.back()" class="w-10 h-10 bg-black/5 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center">
             <span class="material-symbols-outlined text-[#0e0e10]">arrow_back</span>
          </button>
          <div class="flex-1">
            <p class="text-xs text-orange-500 uppercase font-bold tracking-widest mb-1">Evaluación oficial</p>
            <h2 class="text-3xl font-extrabold text-[#0e0e10] leading-tight brand">Reseña para <br/><span class="text-orange-500">{{ establishmentName }}</span></h2>
          </div>
        </div>

        <form @submit.prevent="submitReview" class="space-y-8">
          
          <!-- Star Ratings Section -->
          <div class="space-y-6 bg-[#FAF9F6] p-6 text-[#3f3f42] rounded-2xl border border-black/5 shadow-inner">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="font-bold uppercase tracking-wide text-xs">Calidad de la Comida</label>
              <div class="flex gap-1" @mouseleave="hoveredFood = 0">
                <button 
                  type="button" 
                  v-for="star in 5" 
                  :key="'f'+star"
                  @mouseover="hoveredFood = star"
                  @click="foodScore = star"
                  class="focus:outline-none transition-transform hover:scale-110"
                >
                  <span class="material-symbols-outlined text-3xl" :style="{ color: renderStars(foodScore, hoveredFood)[star-1] ? '#f97316' : '#d1d1d6', fontVariationSettings: `'FILL' ${renderStars(foodScore, hoveredFood)[star-1] ? 1 : 0}` }">star</span>
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="font-bold uppercase tracking-wide text-xs">Servicio y Atención</label>
              <div class="flex gap-1" @mouseleave="hoveredService = 0">
                <button 
                  type="button" 
                  v-for="star in 5" 
                  :key="'s'+star"
                  @mouseover="hoveredService = star"
                  @click="serviceScore = star"
                  class="focus:outline-none transition-transform hover:scale-110"
                >
                   <span class="material-symbols-outlined text-3xl" :style="{ color: renderStars(serviceScore, hoveredService)[star-1] ? '#f97316' : '#d1d1d6', fontVariationSettings: `'FILL' ${renderStars(serviceScore, hoveredService)[star-1] ? 1 : 0}` }">star</span>
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="font-bold uppercase tracking-wide text-xs">Relación Precio/Valor</label>
              <div class="flex gap-1" @mouseleave="hoveredPrice = 0">
                <button 
                  type="button" 
                  v-for="star in 5" 
                  :key="'p'+star"
                  @mouseover="hoveredPrice = star"
                  @click="priceScore = star"
                  class="focus:outline-none transition-transform hover:scale-110"
                >
                   <span class="material-symbols-outlined text-3xl" :style="{ color: renderStars(priceScore, hoveredPrice)[star-1] ? '#f97316' : '#d1d1d6', fontVariationSettings: `'FILL' ${renderStars(priceScore, hoveredPrice)[star-1] ? 1 : 0}` }">star</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Text Review -->
          <div>
            <label class="font-bold text-[#0e0e10] mb-2 block brand">Cuéntanos más detalles</label>
            <textarea
              v-model="comment"
              rows="4"
              class="w-full bg-white rounded-xl border border-black/10 p-5 text-[#0e0e10] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-sm"
              placeholder="¿Qué platillo pediste? ¿Cómo estuvo el sabor? Toda crítica constructiva suma."
              :maxlength="COMMENT_MAX"
            ></textarea>
            <div class="flex justify-between mt-1">
              <span v-if="commentTooShort" class="text-xs text-red-500 font-bold">Mínimo 10 caracteres si escribes un comentario</span>
              <span v-else class="flex-1"></span>
              <span class="text-xs text-[#adaaad] font-bold">{{ commentLength }} / {{ COMMENT_MAX }} MAX</span>
            </div>
          </div>

          <!-- Adding Images Mockup -->
          <div>
            <label class="font-bold text-[#0e0e10] mb-2 block brand">Añadir Evidencia (Opcional)</label>
            <div class="border-2 border-dashed border-orange-500/30 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors p-8 text-center cursor-pointer relative" @click="triggerFileInput">
              <input type="file" ref="fileInput" @change="onFileSelect" class="hidden" accept="image/*" />
              <span class="material-symbols-outlined text-orange-500 text-4xl mb-2">add_photo_alternate</span>
              <p class="font-bold text-orange-500 mb-1 tracking-wide">Haz clic para subir fotos de tu platillo</p>
              <p class="text-xs text-[#525155]">Soporta JPG, PNG (Toma real de los alimentos)</p>
            </div>
            
            <!-- Previews -->
            <div v-if="uploadedImages.length > 0" class="flex gap-4 mt-6 overflow-x-auto pb-2">
              <div v-for="(img, i) in uploadedImages" :key="i" class="w-24 h-24 rounded-xl overflow-hidden relative shadow-md shrink-0 border border-black/10">
                <img :src="img" class="w-full h-full object-cover" />
                <button @click.prevent="removeImage(i)" class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center shadow-lg transition-colors">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="error" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-200">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button type="submit" :disabled="!formValid" class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2" style="margin-top: 2rem;">
            <span class="material-symbols-outlined font-bold">send</span>
            {{ loading ? 'PROCESANDO...' : 'PUBLICAR RESEÑA' }}
          </button>

        </form>
      </div>
    </div>
  </div>
</template>
