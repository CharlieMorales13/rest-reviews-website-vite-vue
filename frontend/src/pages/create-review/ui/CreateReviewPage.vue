<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { uploadImage } from '@/shared/api/uploadImage';
import { ReviewService } from '@/entities/review/api/ReviewService';

const route = useRoute();
const router = useRouter();
const establishmentSlug = route.params.slug as string;

const establishmentName = ref('el Establecimiento');
const establishmentId = ref('');
onMounted(async () => {
  try {
    const establishments = await ReviewService.getEstablishments();
    const found = establishments.find(e => e.slug === establishmentSlug);
    if (found) {
      establishmentName.value = found.name;
      establishmentId.value = found.id;
    }
  } catch {
    // fallback ya está en el valor por defecto
  }
});

const foodScore = ref(0);
const serviceScore = ref(0);
const priceScore = ref(0);
const title = ref('');
const comment = ref('');
const agreedToDisclaimer = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const showTips = ref(false);

const TITLE_MIN = 5;
const TITLE_MAX = 100;
const titleLength = computed(() => title.value.length);
const titleValid = computed(() => titleLength.value >= TITLE_MIN && titleLength.value <= TITLE_MAX);

const COMMENT_MIN = 60;
const COMMENT_MAX = 500;
const commentLength = computed(() => comment.value.length);
const commentTooShort = computed(() => commentLength.value < COMMENT_MIN);

const allScoresValid = computed(() => foodScore.value > 0 && serviceScore.value > 0 && priceScore.value > 0);
const formValid = computed(() => allScoresValid.value && !loading.value && commentLength.value >= COMMENT_MIN && commentLength.value <= COMMENT_MAX && titleValid.value && agreedToDisclaimer.value);

// Upload de imagen real
interface UploadedImage {
  previewUrl: string;   // blob URL local para el preview
  remoteUrl: string | null; // URL de Supabase (null mientras sube)
  uploading: boolean;
  errorMessage: string | null;
  file: File;
}

const uploadedImages = ref<UploadedImage[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files?.length) return;

  // Capturar el File ANTES de limpiar el input,
  // porque FileList es un live object que se vacía al hacer reset.
  const file = files[0];
  if (!file) return;

  // Reset el input para permitir seleccionar el mismo archivo de nuevo
  target.value = '';

  const idx = uploadedImages.value.length;
  uploadedImages.value.push({
    previewUrl: URL.createObjectURL(file),
    remoteUrl: null,
    uploading: true,
    errorMessage: null,
    file,
  });

  const entry = uploadedImages.value[idx]!;

  try {
    entry.remoteUrl = await uploadImage(file);
  } catch (err: any) {
    console.error('[Upload]', err);
    entry.remoteUrl = null;
    const msg = err?.response?.data?.message || err.message || 'No se pudo subir la imagen.';
    entry.errorMessage = msg;
  } finally {
    entry.uploading = false;
  }
};

const removeImage = (idx: number) => {
  const img = uploadedImages.value[idx];
  if (img) {
    URL.revokeObjectURL(img.previewUrl);
    uploadedImages.value.splice(idx, 1);
  }
};

const submitReview = async () => {
  if (!formValid.value) return;
  // No enviar si alguna imagen aún está subiendo
  if (uploadedImages.value.some(img => img.uploading)) return;

  loading.value = true;
  error.value = null;

  try {
    const imageUrl = uploadedImages.value.find(img => img.remoteUrl)?.remoteUrl ?? undefined;
    const response = await ReviewService.create({
      establishmentId: establishmentId.value,
      foodScore: foodScore.value,
      serviceScore: serviceScore.value,
      priceScore: priceScore.value,
      title: title.value || undefined,
      comment: comment.value || undefined,
      imageUrl,
    });
    alert(response.message || '¡Evaluación enviada con éxito!');
    router.push(`/establishments/${establishmentSlug}`);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'response' in e) {
      const axiosErr = e as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        error.value = 'Ya has enviado una reseña para este establecimiento anteriormente.';
      } else {
        error.value = axiosErr.response?.data?.message || 'Hubo un error al enviar tu evaluación.';
      }
    } else {
      error.value = 'Hubo un error al enviar tu evaluación.';
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

          <!-- Title -->
          <div>
            <label class="font-bold text-[#0e0e10] brand block mb-2">Título de tu opinión <span class="text-red-500">*</span></label>
            <input
              v-model="title"
              type="text"
              :maxlength="TITLE_MAX"
              placeholder="Ej: Excelente atención y sabor único"
              class="w-full bg-white rounded-xl border border-black/10 px-5 py-4 text-[#0e0e10] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
            />
            <div class="flex justify-between mt-1">
              <span v-if="title.length > 0 && !titleValid" class="text-xs text-red-500 font-bold">Mínimo {{ TITLE_MIN }} caracteres</span>
              <span v-else-if="titleValid" class="text-xs text-green-600 font-bold">✓ Listo</span>
              <span v-else class="text-xs text-[#adaaad]">Escribe un título breve</span>
              <span class="text-xs text-[#adaaad] font-bold">{{ titleLength }} / {{ TITLE_MAX }}</span>
            </div>
          </div>

          <!-- Text Review -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-bold text-[#0e0e10] brand">Cuéntanos más detalles</label>
              <button
                type="button"
                @click="showTips = !showTips"
                class="flex items-center gap-1 text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors"
              >
                <span class="material-symbols-outlined text-sm">lightbulb</span>
                Consejos para tu reseña
              </button>
            </div>

            <!-- Tips panel -->
            <div v-if="showTips" class="mb-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm space-y-3">
              <p class="font-extrabold text-[#0e0e10]">¿Qué hace que una reseña sea excelente?</p>
              <div class="space-y-1">
                <p class="font-bold text-green-700 flex items-center gap-1"><span class="material-symbols-outlined text-base">check_circle</span>Lo que sí debes hacer</p>
                <ul class="text-[#3f3f42] space-y-1 pl-6 list-disc">
                  <li>Menciona qué platillo o bebida pediste</li>
                  <li>Habla del sabor, la temperatura y la presentación</li>
                  <li>Comenta el tiempo de espera y la atención del personal</li>
                  <li>Comparte si el precio te pareció justo para lo que recibiste</li>
                  <li>Sé específico — "los tacos estaban fríos" es más útil que "estuvo mal"</li>
                </ul>
              </div>
              <div class="space-y-1">
                <p class="font-bold text-red-600 flex items-center gap-1"><span class="material-symbols-outlined text-base">cancel</span>Lo que no debes hacer</p>
                <ul class="text-[#3f3f42] space-y-1 pl-6 list-disc">
                  <li>Insultar al personal o a otros estudiantes</li>
                  <li>Escribir todo en MAYÚSCULAS</li>
                  <li>Publicar información personal de otras personas</li>
                  <li>Escribir reseñas de experiencias que no son tuyas</li>
                </ul>
              </div>
            </div>

            <textarea
              v-model="comment"
              rows="4"
              class="w-full bg-white rounded-xl border border-black/10 p-5 text-[#0e0e10] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-sm"
              placeholder="¿Qué platillo pediste? ¿Cómo estuvo el sabor? Toda crítica constructiva suma."
              :maxlength="COMMENT_MAX"
            ></textarea>
            <div class="flex justify-between mt-1">
              <span v-if="commentTooShort" class="text-xs text-red-500 font-bold">Mínimo {{ COMMENT_MIN }} caracteres ({{ COMMENT_MIN - commentLength }} restantes)</span>
              <span v-else class="text-xs text-green-600 font-bold">✓ Listo</span>
              <span class="text-xs text-[#adaaad] font-bold">{{ commentLength }} / {{ COMMENT_MAX }} MAX</span>
            </div>
          </div>

          <!-- Upload de imagen real -->
          <div>
            <label class="font-bold text-[#0e0e10] mb-2 block brand">Añadir Evidencia (Opcional)</label>
            <div
              v-if="uploadedImages.length === 0"
              class="border-2 border-dashed border-orange-500/30 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors p-8 text-center cursor-pointer relative"
              @click="triggerFileInput"
            >
              <input type="file" ref="fileInput" @change="onFileSelect" class="hidden" accept="image/*" />
              <span class="material-symbols-outlined text-orange-500 text-4xl mb-2">add_photo_alternate</span>
              <p class="font-bold text-orange-500 mb-1 tracking-wide">Haz clic para subir una foto de tu platillo</p>
              <p class="text-xs text-[#525155]">Soporta JPG, PNG — máx. 5 MB</p>
            </div>

            <!-- Previews con estado de upload -->
            <div v-if="uploadedImages.length > 0" class="flex gap-4 mt-4 overflow-x-auto pb-2">
              <div v-for="(img, i) in uploadedImages" :key="i" class="shrink-0 flex flex-col gap-1.5">
                <div class="w-28 h-28 rounded-xl overflow-hidden relative shadow-md border border-black/10 bg-black/5">
                  <img :src="img.previewUrl" class="w-full h-full object-cover" />
                  <!-- Overlay: subiendo -->
                  <div v-if="img.uploading" class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span class="text-white text-[10px] font-bold">Subiendo…</span>
                  </div>
                  <!-- Overlay: error -->
                  <div v-else-if="!img.remoteUrl" class="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl">block</span>
                  </div>
                  <!-- Check: subido OK -->
                  <div v-else class="absolute top-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                    <span class="material-symbols-outlined text-white text-xs" style="font-size:12px">check</span>
                  </div>
                  <button @click.prevent="removeImage(i)" class="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg transition-colors">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <!-- Mensaje de error bajo el thumbnail -->
                <p v-if="img.errorMessage" class="w-28 text-[10px] text-red-600 font-bold leading-tight text-center">{{ img.errorMessage }}</p>
              </div>
              <!-- Aviso de imagen pendiente -->
              <p v-if="uploadedImages.some(img => img.uploading)" class="text-xs text-[#525155] self-end pb-2">Espera a que termine la subida antes de publicar</p>
            </div>
          </div>

          <!-- Disclaimer checkbox -->
          <label class="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="agreedToDisclaimer"
              class="mt-1 w-5 h-5 rounded border-black/20 text-orange-500 accent-orange-500 shrink-0 cursor-pointer"
            />
            <span class="text-sm text-[#525155] leading-snug">
              Confirmo que esta reseña refleja mi experiencia personal y honesta. Entiendo que las reseñas falsas o malintencionadas pueden ser eliminadas.
            </span>
          </label>

          <div v-if="error" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-200">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!formValid || uploadedImages.some(img => img.uploading)"
            class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
            style="margin-top: 2rem;"
          >
            <span class="material-symbols-outlined font-bold">send</span>
            {{ loading ? 'PROCESANDO...' : 'PUBLICAR RESEÑA' }}
          </button>

        </form>
      </div>
    </div>
  </div>
</template>
