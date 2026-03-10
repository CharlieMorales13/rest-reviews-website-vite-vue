<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import Chart from 'chart.js/auto';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chart = shallowRef<Chart | null>(null);

onMounted(() => {
  if (!canvasRef.value) return;
  chart.value = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Positivas', 'Neutrales', 'Negativas'],
      datasets: [{
        data: [70, 20, 10],
        backgroundColor: ['#10b981', '#facc15', '#ef4444'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
});
</script>

<template>
  <div style="background:white; padding:25px; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
    <h3 style="text-align:center;">📊 Análisis de Sentimiento Global</h3>
    <div style="height:280px; position:relative;">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>
