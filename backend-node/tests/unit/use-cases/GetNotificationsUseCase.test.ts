import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetNotificationsUseCase } from '../../../src/application/use-cases/notifications/GetNotificationsUseCase';
import type { INotificationRepository } from '../../../src/domain/repositories/INotificationRepository';
import { Notification } from '../../../src/domain/entities/Notification';

const mockRepo: INotificationRepository = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

describe('GetNotificationsUseCase', () => {
  let useCase: GetNotificationsUseCase;

  beforeEach(() => {
    useCase = new GetNotificationsUseCase(mockRepo);
    vi.clearAllMocks();
  });

  it('returns notifications for the user', async () => {
    const notifs = [
      Notification.create({ id: 'n1', userId: 'u1', reviewId: 'r1', isRead: false }),
      Notification.create({ id: 'n2', userId: 'u1', reviewId: 'r2', isRead: true }),
    ];
    vi.mocked(mockRepo.findByUserId).mockResolvedValue(notifs);

    const result = await useCase.execute('u1');

    expect(mockRepo.findByUserId).toHaveBeenCalledWith('u1');
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no notifications', async () => {
    vi.mocked(mockRepo.findByUserId).mockResolvedValue([]);
    const result = await useCase.execute('u1');
    expect(result).toEqual([]);
  });
});
