<script setup lang="ts">
import SentimentChart from '@/widgets/sentiment-chart/ui/SentimentChart.vue';
</script>

<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card"><h3>Reseñas Totales</h3><p>1,240</p></div>
      <div class="stat-card"><h3>IGE Promedio</h3><p>88.5</p></div>
      <div class="stat-card"><h3>Tu Actividad</h3><p>12</p></div>
    </div>
    <SentimentChart />
  </div>
</template>
