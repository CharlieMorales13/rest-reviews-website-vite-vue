<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ReviewService } from '@/entities/review/api/ReviewService';

const route = useRoute();
const router = useRouter();

const establishmentId = route.params.id as string;

const foodScore = ref(5);
const serviceScore = ref(5);
const priceScore = ref(5);
const comment = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const localIGE = computed(() => {
  const food = foodScore.value * 0.5;
  const service = serviceScore.value * 0.3;
  const price = priceScore.value * 0.2;
  return (food + service + price).toFixed(1);
});

const submitReview = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await ReviewService.create({
      establishmentId,
      foodScore: foodScore.value,
      serviceScore: serviceScore.value,
      priceScore: priceScore.value,
      comment: comment.value
    });
    // Show mock success message
    alert(response.message || '¡Evaluación enviada con éxito!');
    router.push('/establishments');
  } catch (e: any) {
    if (e.response?.status === 409) {
      error.value = 'Ya has enviado una reseña para este establecimiento anteriormente. No puedes enviar otra.';
    } else {
      error.value = e.response?.data?.message || 'Hubo un error al enviar tu evaluación.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <div class="glass-panel form-card">
      <div class="form-header">
        <h2>Evaluar Establecimiento</h2>
        <router-link to="/establishments" class="btn-back">← Volver</router-link>
      </div>

      <form @submit.prevent="submitReview" class="review-form">
        <div class="score-group">
          <label>Calidad de la Comida (1-5)</label>
          <input type="range" v-model.number="foodScore" min="1" max="5" class="slider" />
          <span class="score-val">{{ foodScore }}</span>
        </div>

        <div class="score-group">
          <label>Servicio y Atención (1-5)</label>
          <input type="range" v-model.number="serviceScore" min="1" max="5" class="slider" />
          <span class="score-val">{{ serviceScore }}</span>
        </div>

        <div class="score-group">
          <label>Relación Calidad-Precio (1-5)</label>
          <input type="range" v-model.number="priceScore" min="1" max="5" class="slider" />
          <span class="score-val">{{ priceScore }}</span>
        </div>

        <div class="form-group">
          <label>Comentario (Opcional)</label>
          <textarea v-model="comment" rows="4" placeholder="¿Qué te pareció el lugar?"></textarea>
        </div>

        <div class="ige-preview">
          Calculo IGE local: <strong>{{ localIGE }}</strong> / 5.0
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">Enviando...</span>
          <span v-else>Enviar Reseña</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  display: flex;
  justify-content: center;
}
.form-card {
  width: 100%;
  max-width: 600px;
  padding: 2.5rem;
}
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.btn-back {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.score-group {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.score-group label {
  flex: 1;
  font-weight: 500;
}
.slider {
  flex: 2;
  accent-color: var(--primary-color);
}
.score-val {
  width: 30px;
  text-align: center;
  font-weight: bold;
  color: var(--primary-color);
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 0.2rem;
}
.ige-preview {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid var(--primary-color);
  font-size: 1.1rem;
}
.error-msg {
  color: #ff4d4f;
  margin-bottom: 1rem;
  font-weight: 500;
  padding: 0.5rem;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 4px;
}
</style>
