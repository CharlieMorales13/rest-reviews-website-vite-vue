export interface Notification {
  id: string;
  reviewId: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actorName?: string | null;
}
