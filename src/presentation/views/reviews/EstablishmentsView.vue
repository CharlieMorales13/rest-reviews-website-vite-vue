<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReviewService } from '../../../infrastructure/services/ReviewService';
import type { Establishment } from '../../../core/types/review';
import { useAuthStore } from '../../../application/stores/useAuthStore';
import { useRouter } from 'vue-router';

const establishments = ref<Establishment[]>([]);
const loading = ref(true);
const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  try {
    establishments.value = await ReviewService.getEstablishments();
  } catch (e) {
    console.error(e);
    // Demostration fallback data for final presentation
    establishments.value = [
      { id: '1', name: 'Cucko', category: 'Restaurante', calificacion: 4.5 },
      { id: '2', name: 'Cucko Box', category: 'Snacks', calificacion: 3.9 },
      { id: '3', name: 'Oaxaqueñito', category: 'Restaurante', calificacion: 4.8 },
      { id: '4', name: 'Delly Food', category: 'Comida Orgánica', calificacion: 4.2 }
    ] as any;
  } finally {
    loading.value = false;
  }
});

const goToReview = (id: string) => {
  router.push({ name: 'create-review', params: { id } });
};
</script>

<template>
  <div class="page-container">
    <div class="page-title">
      <h2>Establecimientos Universitarios</h2>
      <span class="active-badge">Sesión Activa</span>
    </div>

    <div v-if="loading" class="loading-state">Cargando establecimientos...</div>
    
    <div v-else class="grid">
      <div v-for="est in establishments" :key="est.id" class="glass-panel est-card">
        <div class="card-header-row">
          <h3>{{ est.name }}</h3>
          <span class="rating">⭐ {{ (est as any).calificacion }}</span>
        </div>
        <span class="category-badge">{{ est.category }}</span>
        <div class="card-actions">
          <button @click="goToReview(est.id)" class="btn-primary" style="width: 100%">
            Evaluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.page-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.active-badge {
  background: rgba(6, 214, 160, 0.2);
  color: var(--success-color);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
.est-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.card-header-row h3 {
  margin-bottom: 0;
}
.rating {
  font-weight: bold;
  color: #facc15;
}
.category-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  font-size: 0.8rem;
  margin-bottom: 1.5rem;
  align-self: flex-start;
}
.card-actions {
  margin-top: auto;
}
</style>
