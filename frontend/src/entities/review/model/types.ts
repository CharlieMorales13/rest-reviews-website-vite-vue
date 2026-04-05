export interface Review {
  id: string;
  establishmentId: string;
  foodScore: number;
  serviceScore: number;
  priceScore: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  establishmentId: string;
  foodScore: number;
  serviceScore: number;
  priceScore: number;
  comment?: string;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data: Review;
}

export interface Establishment {
  id: string;
  name: string;
  category: string;
  managerId?: string;
}


export interface MetricsSnapshot {
  establishmentId: string;
  IGE: number;
  negativeRatio: number;
  avgFood: number;
  avgService: number;
  avgPrice: number;
  snapshotDate: string;
}
