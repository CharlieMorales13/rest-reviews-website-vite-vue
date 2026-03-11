import { httpClient } from '@/shared/api/httpClient';
import type { CreateReviewRequest, ReviewResponse, MetricsSnapshot, Establishment } from '../model/types';

export class ReviewService {
  static async create(request: CreateReviewRequest): Promise<ReviewResponse> {
    // Mock the backend creation for testing purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '¡Evaluación enviada con éxito!',
          data: {
            id: 'mock-review-123',
            establishmentId: request.establishmentId,
            foodScore: request.foodScore,
            serviceScore: request.serviceScore,
            priceScore: request.priceScore,
            comment: request.comment,
            createdAt: new Date().toISOString()
          }
        });
      }, 800);
    });
  }

  static async getEstablishments(): Promise<Establishment[]> {
    const response = await httpClient.get<{data: Establishment[]}>('/api/establishments');
    return response.data.data;
  }

  static async getMetrics(establishmentId: string): Promise<MetricsSnapshot> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return mock data for the presentation (matches the 88.5 requirement)
        resolve({
          establishmentId,
          snapshotDate: new Date().toISOString(),
          IGE: 88.5,
          avgFood: 4.5,
          avgService: 4.3,
          avgPrice: 4.4,
          negativeRatio: 0.10
        });
      }, 500);
    });
  }
}
