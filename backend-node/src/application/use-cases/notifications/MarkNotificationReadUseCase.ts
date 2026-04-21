import { injectable, inject } from "tsyringe";
import { Notification } from "../../../domain/entities/Notification";
import { INotificationRepository } from "../../../domain/repositories/INotificationRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @inject("INotificationRepository")
    private notificationRepository: INotificationRepository,
  ) {}

  async execute(
    notificationId: string,
    requestingUserId: string,
  ): Promise<Notification> {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) throw new AppError("Notification not found", 404);
    if (notification.userId !== requestingUserId)
      throw new AppError("Forbidden", 403);

    notification.markAsRead();
    return this.notificationRepository.update(notification);
  }
}
