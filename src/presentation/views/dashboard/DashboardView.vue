<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDashboardStore } from '../../../application/stores/useDashboardStore';
import Chart from 'chart.js/auto';

// In a real application, the manager might select a specific establishment or see overall stats.  
const ESTABLISHMENT_ID = 'demo-id'; 

const dashboardStore = useDashboardStore();
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const renderChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Positivas', 'Neutrales', 'Negativas'],
      datasets: [{
        data: [70, 20, 10],
        backgroundColor: ['#10b981', '#facc15', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#fff' } }
      }
    }
  });
};

onMounted(() => {
  dashboardStore.fetchMetrics(ESTABLISHMENT_ID);
  setTimeout(renderChart, 100);
});
</script>

<template>
  <div class="page-container">
    <header class="top-nav">
      <h1>Índice Global de Experiencia (IGE)</h1>
      <p>Inteligencia Operativa para Establecimientos Universitarios</p>
    </header>

      <div class="stats-grid">
        <div class="kpi-card glass-panel">
          <h3>Reseñas Totales</h3>
          <p class="kpi-value text-large">1,240</p>
        </div>
        <div class="kpi-card glass-panel highlight">
          <h3>IGE Promedio</h3>
          <p class="kpi-value highlight-text text-large">88.5</p>
        </div>
        <div class="kpi-card glass-panel">
          <h3>Tu Actividad</h3>
          <p class="kpi-value text-large">12</p>
        </div>
      </div>

      <div class="chart-container glass-panel">
        <h3 class="chart-title">📊 Análisis de Sentimiento Global</h3>
        <div class="canvas-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <h2 style="margin: 3rem 0 1rem 0;">Métricas por Establecimiento (Demo)</h2>
      <div v-if="dashboardStore.isLoading" class="loading">Cargando métricas...</div>
      
      <div v-else-if="dashboardStore.metrics" class="dashboard-grid">
        <!-- Main IGE Score -->
        <div class="kpi-card glass-panel highlight">
          <h3>IGE Ponderado</h3>
          <div class="kpi-value highlight-text">{{ dashboardStore.metrics.IGE.toFixed(1) }}</div>
          <p class="subtitle">Métrica general</p>
        </div>

        <!-- Sub metrics -->
        <div class="kpi-card glass-panel">
          <h3>Comida (50%)</h3>
          <div class="kpi-value">{{ dashboardStore.metrics.avgFood.toFixed(1) }} <span class="max">/ 5</span></div>
        </div>

        <div class="kpi-card glass-panel">
          <h3>Atención (30%)</h3>
          <div class="kpi-value">{{ dashboardStore.metrics.avgService.toFixed(1) }} <span class="max">/ 5</span></div>
        </div>

        <div class="kpi-card glass-panel">
          <h3>Precio (20%)</h3>
          <div class="kpi-value">{{ dashboardStore.metrics.avgPrice.toFixed(1) }} <span class="max">/ 5</span></div>
        </div>

        <div class="kpi-card glass-panel negative">
          <h3>Reseñas Negativas</h3>
          <div class="kpi-value text-error">{{ (dashboardStore.metrics.negativeRatio * 100).toFixed(0) }}%</div>
          <p class="subtitle text-error">Análisis de Sentimiento M.L.</p>
        </div>
      </div>
      
    <div v-else class="empty-state glass-panel">
      <p>No se encontraron datos analíticos de momento.</p>
      <button class="btn-primary" style="max-width:300px; margin: 0 auto;" @click="() => {
        dashboardStore.$patch({
          metrics: { IGE: 85.4, avgFood: 4.5, avgService: 4.1, avgPrice: 4.0, negativeRatio: 0.12, establishmentId: '1', snapshotDate: new Date().toISOString() }
        })
      }">Cargar Datos de Demostración</button>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
.top-nav {
  margin-bottom: 3rem;
}
.top-nav p {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
.text-large {
  font-size: 3.5rem !important;
}
.chart-container {
  padding: 2rem;
  margin-bottom: 2rem;
}
.chart-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}
.canvas-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.kpi-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}
.kpi-card.highlight {
  background: rgba(252, 163, 17, 0.05);
  border-color: rgba(252, 163, 17, 0.2);
}
.kpi-card h3 {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 1rem;
}
.kpi-value {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.kpi-value .max {
  font-size: 1rem;
  color: var(--text-secondary);
}
.highlight-text {
  color: var(--primary-color);
}
.subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.text-error {
  color: var(--error-color);
}
.empty-state {
  padding: 4rem;
  text-align: center;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-state p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
}
</style>
