import { httpClient } from '@/shared/api/httpClient';
import type { CreateReviewRequest, UpdateReviewRequest, ReviewResponse, MetricsSnapshot, Establishment, MyReview, EstablishmentReview } from '../model/types';

export class ReviewService {
  static async create(request: CreateReviewRequest): Promise<ReviewResponse> {
    const response = await httpClient.post<ReviewResponse>('/api/reviews', request);
    return response.data;
  }

  static async getEstablishments(): Promise<Establishment[]> {
    const response = await httpClient.get<{ success: boolean; data: Establishment[] }>('/api/establishments');
    return response.data.data;
  }

  static async getEstablishment(slug: string): Promise<Establishment> {
    const response = await httpClient.get<{ success: boolean; data: Establishment }>(`/api/establishments/${slug}`);
    return response.data.data;
  }

  static async getEstablishmentReviews(slug: string, page = 1, limit = 20): Promise<{ data: EstablishmentReview[]; total: number }> {
    const response = await httpClient.get<{ data: EstablishmentReview[]; meta: { total: number } }>(
      `/api/establishments/${slug}/reviews?page=${page}&limit=${limit}`
    );
    return { data: response.data.data, total: response.data.meta?.total ?? 0 };
  }

  static async updateReview(id: string, request: UpdateReviewRequest): Promise<void> {
    await httpClient.patch(`/api/reviews/${id}`, request);
  }

  static async deleteReview(id: string): Promise<void> {
    await httpClient.delete(`/api/reviews/${id}`);
  }

  static async getMyReviews(): Promise<MyReview[]> {
    const response = await httpClient.get<{ success: boolean; data: MyReview[] }>('/api/reviews/my');
    return response.data.data;
  }

  static async getMetrics(establishmentId: string): Promise<MetricsSnapshot> {
    const response = await httpClient.get<{ success: boolean; data: MetricsSnapshot }>(`/api/metrics/establishment/${establishmentId}`);
    return response.data.data;
  }

  static async likeReview(reviewId: string): Promise<{ likesCount: number; likedByMe: boolean }> {
    const response = await httpClient.post<{ success: boolean; data: { likesCount: number; likedByMe: boolean } }>(
      `/api/reviews/${reviewId}/like`,
    );
    return response.data.data;
  }

  static async unlikeReview(reviewId: string): Promise<{ likesCount: number; likedByMe: boolean }> {
    const response = await httpClient.delete<{ success: boolean; data: { likesCount: number; likedByMe: boolean } }>(
      `/api/reviews/${reviewId}/like`,
    );
    return response.data.data;
  }
}
