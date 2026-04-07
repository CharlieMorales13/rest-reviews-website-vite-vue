import { httpClient } from '@/shared/api/httpClient';
import type { CreateReviewRequest, ReviewResponse, MetricsSnapshot, Establishment, MyReview, EstablishmentReview } from '../model/types';

export class ReviewService {
  static async create(request: CreateReviewRequest): Promise<ReviewResponse> {
    const response = await httpClient.post<ReviewResponse>('/api/reviews', request);
    return response.data;
  }

  static async getEstablishments(): Promise<Establishment[]> {
    const response = await httpClient.get<{ success: boolean; data: Establishment[] }>('/api/establishments');
    return response.data.data;
  }

  static async getEstablishment(id: string): Promise<Establishment> {
    const response = await httpClient.get<{ success: boolean; data: Establishment }>(`/api/establishments/${id}`);
    return response.data.data;
  }

  static async getEstablishmentReviews(id: string, page = 1, limit = 20): Promise<{ data: EstablishmentReview[]; total: number }> {
    const response = await httpClient.get<{ data: EstablishmentReview[]; meta: { total: number } }>(
      `/api/establishments/${id}/reviews?page=${page}&limit=${limit}`
    );
    return { data: response.data.data, total: response.data.meta?.total ?? 0 };
  }

  static async getMyReviews(): Promise<MyReview[]> {
    const response = await httpClient.get<{ success: boolean; data: MyReview[] }>('/api/reviews/my');
    return response.data.data;
  }

  static async getMetrics(establishmentId: string): Promise<MetricsSnapshot> {
    const response = await httpClient.get<{ success: boolean; data: MetricsSnapshot }>(`/api/metrics/establishment/${establishmentId}`);
    return response.data.data;
  }
}
