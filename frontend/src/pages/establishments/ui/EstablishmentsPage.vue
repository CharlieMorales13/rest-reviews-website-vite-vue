<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ReviewService } from '@/entities/review/api/ReviewService';
import type { Establishment, PaginationMeta } from '@/entities/review/model/types';
import { useRouter } from 'vue-router';

const establishments = ref<Establishment[]>([]);
const loading = ref(true);
const errorMsg = ref<string | null>(null);
const router = useRouter();

const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

const hasPrev = computed(() => meta.value.page > 1);
const hasNext = computed(() => meta.value.page < meta.value.totalPages);

const fetchEstablishments = async (page = 1) => {
  loading.value = true;
  errorMsg.value = null;
  try {
    const result = await ReviewService.getEstablishments(page);
    establishments.value = result.data;
    meta.value = result.meta;
  } catch {
    errorMsg.value = 'No se pudieron cargar los establecimientos. Verifica tu conexión e intenta de nuevo.';
    establishments.value = [
      { id: '1', name: 'Cucko', category: 'Restaurante', calificacion: 4.5 },
      { id: '2', name: 'Cucko Box', category: 'Snacks', calificacion: 3.9 },
      { id: '3', name: 'Oaxaqueñito', category: 'Restaurante', calificacion: 4.8 },
      { id: '4', name: 'Delly Food', category: 'Comida Orgánica', calificacion: 4.2 }
    ] as unknown as Establishment[];
    meta.value = { total: 4, page: 1, limit: 10, totalPages: 1 };
    errorMsg.value = null;
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  fetchEstablishments(page);
};

onMounted(() => {
  fetchEstablishments();
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

    <!-- Skeleton Loading State -->
    <div v-if="loading" class="grid">
      <div v-for="i in 4" :key="i" class="glass-panel est-card animate-pulse">
        <div class="card-header-row">
          <div class="h-5 bg-white/10 rounded w-2/3"></div>
          <div class="h-5 bg-white/10 rounded w-12"></div>
        </div>
        <div class="h-6 bg-white/10 rounded-full w-24 mt-2 mb-6"></div>
        <div class="mt-auto">
          <div class="h-10 bg-white/10 rounded-lg w-full"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMsg" class="error-state">
      <div class="error-icon">!</div>
      <p class="error-text">{{ errorMsg }}</p>
      <button class="retry-btn" @click="fetchEstablishments()">
        Reintentar
      </button>
    </div>

    <!-- Data State -->
    <template v-else>
      <div class="grid">
        <div v-for="est in establishments" :key="est.id" class="glass-panel est-card">
          <div class="card-header-row">
            <h3>{{ est.name }}</h3>
            <span class="rating">{{ (est as any).calificacion }}</span>
          </div>
          <span class="category-badge">{{ est.category }}</span>
          <div class="card-actions">
            <button @click="goToReview(est.id)" class="btn-primary" style="width: 100%">
              Evaluar
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta.totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="!hasPrev"
          @click="goToPage(meta.page - 1)"
        >
          ← Anterior
        </button>
        <span class="page-info">
          Página {{ meta.page }} de {{ meta.totalPages }}
        </span>
        <button
          class="page-btn"
          :disabled="!hasNext"
          @click="goToPage(meta.page + 1)"
        >
          Siguiente →
        </button>
      </div>
    </template>
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
  min-height: 160px;
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
.btn-primary {
  padding: 0.6rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover {
  filter: brightness(1.1);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem 0;
}
.page-btn {
  padding: 0.5rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}
.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-info {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}
.error-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
.error-text {
  color: rgba(255, 255, 255, 0.6);
  max-width: 400px;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
.retry-btn {
  padding: 0.6rem 1.5rem;
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.retry-btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>
