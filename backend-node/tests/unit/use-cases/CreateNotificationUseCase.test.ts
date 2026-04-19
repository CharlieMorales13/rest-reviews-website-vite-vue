import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateNotificationUseCase } from '../../../src/application/use-cases/notifications/CreateNotificationUseCase';
import type { INotificationRepository } from '../../../src/domain/repositories/INotificationRepository';
import { Notification } from '../../../src/domain/entities/Notification';

const mockRepo: INotificationRepository = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

describe('CreateNotificationUseCase', () => {
  let useCase: CreateNotificationUseCase;

  beforeEach(() => {
    useCase = new CreateNotificationUseCase(mockRepo);
    vi.clearAllMocks();
  });

  it('saves and returns a notification', async () => {
    const saved = Notification.create({ id: 'n1', userId: 'u1', reviewId: 'r1' });
    vi.mocked(mockRepo.save).mockResolvedValue(saved);

    const result = await useCase.execute({ userId: 'u1', reviewId: 'r1' });

    expect(mockRepo.save).toHaveBeenCalledOnce();
    const passedNotification: Notification = vi.mocked(mockRepo.save).mock.calls[0][0];
    expect(passedNotification.userId).toBe('u1');
    expect(passedNotification.reviewId).toBe('r1');
    expect(passedNotification.type).toBe('manager_reply');
    expect(result.id).toBe('n1');
  });
});
