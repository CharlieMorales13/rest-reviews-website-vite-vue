import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/infrastructure/database/prisma.service', () => ({
  default: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '@/infrastructure/database/prisma.service';
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository';
import { Notification } from '@/domain/entities/Notification';

describe('PrismaNotificationRepository', () => {
  let repo: PrismaNotificationRepository;

  beforeEach(() => {
    repo = new PrismaNotificationRepository();
    vi.clearAllMocks();
  });

  it('save() creates and maps a notification', async () => {
    const row = { id: 'uuid-1', userId: 'u1', reviewId: 'r1', type: 'manager_reply', isRead: false, createdAt: new Date() };
    vi.mocked(prisma.notification.create).mockResolvedValue(row as any);

    const n = Notification.create({ userId: 'u1', reviewId: 'r1' });
    const result = await repo.save(n);

    expect(prisma.notification.create).toHaveBeenCalledOnce();
    expect(result.id).toBe('uuid-1');
    expect(result.isRead).toBe(false);
  });

  it('findByUserId() returns mapped notifications', async () => {
    const rows = [
      { id: 'uuid-2', userId: 'u1', reviewId: 'r2', type: 'manager_reply', isRead: false, createdAt: new Date() },
    ];
    vi.mocked(prisma.notification.findMany).mockResolvedValue(rows as any);

    const results = await repo.findByUserId('u1');

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('u1');
  });

  it('update() persists isRead change', async () => {
    const row = { id: 'uuid-3', userId: 'u1', reviewId: 'r3', type: 'manager_reply', isRead: true, createdAt: new Date() };
    vi.mocked(prisma.notification.update).mockResolvedValue(row as any);

    const n = Notification.create({ id: 'uuid-3', userId: 'u1', reviewId: 'r3', isRead: true });
    const result = await repo.update(n);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'uuid-3' },
      data: { isRead: true },
    });
    expect(result.isRead).toBe(true);
  });
});
