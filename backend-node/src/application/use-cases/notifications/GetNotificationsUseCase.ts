import { injectable, inject } from 'tsyringe';
import { Notification } from '../../../domain/entities/Notification';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';

@injectable()
export class GetNotificationsUseCase {
  constructor(
    @inject('INotificationRepository') private notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId);
  }
}
