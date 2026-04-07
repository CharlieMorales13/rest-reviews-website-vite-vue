import { httpClient } from '@/shared/api/httpClient';
import type { CreateReviewRequest, ReviewResponse, MetricsSnapshot, Establishment } from '../model/types';

export class ReviewService {
  static async create(request: CreateReviewRequest): Promise<ReviewResponse> {
    const response = await httpClient.post<ReviewResponse>('/api/reviews', request);
    return response.data;
  }

  // GET /api/establishments → { success: true, data: Establishment[] }
  static async getEstablishments(): Promise<Establishment[]> {
    const response = await httpClient.get<{ success: boolean; data: Establishment[] }>('/api/establishments');
    return response.data.data;
  }

  static async getMetrics(establishmentId: string): Promise<MetricsSnapshot> {
    const response = await httpClient.get<{ success: boolean; data: MetricsSnapshot }>(`/api/metrics/establishment/${establishmentId}`);
    return response.data.data;
  }
}
