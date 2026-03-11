import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MetricsSnapshot } from '../../core/types/review';
import { ReviewService } from '../../infrastructure/services/ReviewService';

export const useDashboardStore = defineStore('dashboard', () => {
  const metrics = ref<MetricsSnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchMetrics = async (establishmentId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      metrics.value = await ReviewService.getMetrics(establishmentId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch metrics';
    } finally {
      isLoading.value = false;
    }
  };

  return { metrics, isLoading, error, fetchMetrics };
});
