export interface Review {
  id: string;
  establishmentId: string;
  foodScore: number;
  serviceScore: number;
  priceScore: number;
  comment?: string | null;
  imageUrl?: string | null;
  sentiment?: string | null;
  managerReply?: string | null;
  managerReplyAt?: string | null;
  createdAt: string;
}

export interface MyReview extends Review {
  establishmentName: string | null;
}

export interface EstablishmentReview extends Review {
  author: string | null;
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
  description?: string;
  locationDetails?: string;
  openingHours?: string;
  galleryUrls?: string[];
  menuUrls?: string[];
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
