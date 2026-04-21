import { Notification } from "../entities/Notification";

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findByUserId(userId: string): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  update(notification: Notification): Promise<Notification>;
}
