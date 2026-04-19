import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkNotificationReadUseCase } from '../../../src/application/use-cases/notifications/MarkNotificationReadUseCase';
import type { INotificationRepository } from '../../../src/domain/repositories/INotificationRepository';
import { Notification } from '../../../src/domain/entities/Notification';
import { AppError } from '../../../src/infrastructure/http/errors/AppError';

const mockRepo: INotificationRepository = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

describe('MarkNotificationReadUseCase', () => {
  let useCase: MarkNotificationReadUseCase;

  beforeEach(() => {
    useCase = new MarkNotificationReadUseCase(mockRepo);
    vi.clearAllMocks();
  });

  it('marks notification as read when owner requests it', async () => {
    const notif = Notification.create({ id: 'n1', userId: 'u1', reviewId: 'r1', isRead: false });
    const updated = Notification.create({ id: 'n1', userId: 'u1', reviewId: 'r1', isRead: true });
    vi.mocked(mockRepo.findById).mockResolvedValue(notif);
    vi.mocked(mockRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute('n1', 'u1');

    expect(mockRepo.update).toHaveBeenCalledOnce();
    expect(result.isRead).toBe(true);
  });

  it('throws 404 when notification not found', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute('n1', 'u1')).rejects.toThrow(AppError);
    await expect(useCase.execute('n1', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when a different user tries to mark as read', async () => {
    const notif = Notification.create({ id: 'n1', userId: 'u1', reviewId: 'r1' });
    vi.mocked(mockRepo.findById).mockResolvedValue(notif);
    await expect(useCase.execute('n1', 'u2')).rejects.toThrow(AppError);
    await expect(useCase.execute('n1', 'u2')).rejects.toMatchObject({ statusCode: 403 });
  });
});
