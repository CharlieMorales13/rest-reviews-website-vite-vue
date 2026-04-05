import { httpClient } from '@/shared/api/httpClient';
import type { CreateReviewRequest, ReviewResponse, MetricsSnapshot, Establishment } from '../model/types';

export class ReviewService {
  // TODO: conectar al API real — POST /api/reviews
  static async create(request: CreateReviewRequest): Promise<ReviewResponse> {
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

  // GET /api/establishments → { success: true, data: Establishment[] }
  static async getEstablishments(): Promise<Establishment[]> {
    const response = await httpClient.get<{ success: boolean; data: Establishment[] }>('/api/establishments');
    return response.data.data;
  }

  // TODO: conectar al API real — GET /api/metrics/establishment/:id
  static async getMetrics(establishmentId: string): Promise<MetricsSnapshot> {
    return new Promise((resolve) => {
      setTimeout(() => {
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
