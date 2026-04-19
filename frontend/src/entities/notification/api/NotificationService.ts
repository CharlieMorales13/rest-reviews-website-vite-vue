import { httpClient } from '@/shared/api/httpClient';
import type { Notification } from '../model/types';

export class NotificationService {
  static async getAll(): Promise<Notification[]> {
    const res = await httpClient.get<{ success: boolean; data: Notification[] }>('/api/notifications');
    return res.data.data;
  }

  static async markAsRead(id: string): Promise<void> {
    await httpClient.patch(`/api/notifications/${id}/read`, {});
  }
}
