import { Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetNotificationsUseCase } from '../../../application/use-cases/notifications/GetNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../../application/use-cases/notifications/MarkNotificationReadUseCase';
import { AuthRequest } from '../middlewares/AuthMiddleware';

@injectable()
export class NotificationController {
  constructor(
    @inject(GetNotificationsUseCase) private getNotifications: GetNotificationsUseCase,
    @inject(MarkNotificationReadUseCase) private markRead: MarkNotificationReadUseCase,
  ) {}

  public getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    const notifications = await this.getNotifications.execute(req.user!.userId);
    const data = notifications.map(n => ({
      id: n.id,
      reviewId: n.reviewId,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
    res.json({ success: true, data });
  };

  public markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    const updated = await this.markRead.execute(req.params.id, req.user!.userId);
    res.json({ success: true, data: { id: updated.id, isRead: updated.isRead } });
  };
}
