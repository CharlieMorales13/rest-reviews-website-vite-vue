import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPasswordUseCase } from '@/application/use-cases/auth/ResetPasswordUseCase';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UserRole } from '@/domain/entities/User';
import * as jwt from 'jsonwebtoken';

vi.mock('@/infrastructure/config/env.config', () => ({
  env: { JWT_SECRET: 'test-secret-for-tests', FRONTEND_URL: 'http://localhost:5173' },
}));

vi.mock('@/infrastructure/database/prisma.service', () => ({
  default: {
    userSession: {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  },
}));

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('new-hashed-password'),
}));

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'carlos@anahuac.mx',
    name: 'Carlos',
    username: 'carlos',
    role: UserRole.STUDENT,
    isActive: true,
    isVerified: true,
    passwordHash: 'hashed',
    updatePasswordHash: vi.fn(),
    ...overrides,
  };
}

const validToken = jwt.sign(
  { userId: 'user-1', purpose: 'password-reset' },
  'test-secret-for-tests',
  { expiresIn: '1h' }
);

describe('ResetPasswordUseCase', () => {
  let repo: IUserRepository;

  beforeEach(() => {
    repo = { findById: vi.fn(), update: vi.fn() } as any;
    vi.clearAllMocks();
  });

  it('throws 400 when token purpose is not password-reset', async () => {
    const wrongToken = jwt.sign(
      { userId: 'user-1', purpose: 'something-else' },
      'test-secret-for-tests',
      { expiresIn: '1h' }
    );
    await expect(
      new ResetPasswordUseCase(repo).execute({ token: wrongToken, newPassword: 'newpass123' })
    ).rejects.toThrow('Invalid reset token');
  });

  it('throws when token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: 'user-1', purpose: 'password-reset' },
      'test-secret-for-tests',
      { expiresIn: '-1s' }
    );
    await expect(
      new ResetPasswordUseCase(repo).execute({ token: expiredToken, newPassword: 'newpass123' })
    ).rejects.toThrow();
  });

  it('throws 404 when user not found', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(
      new ResetPasswordUseCase(repo).execute({ token: validToken, newPassword: 'newpass123' })
    ).rejects.toThrow('User not found');
  });

  it('updates passwordHash and deletes all sessions on success', async () => {
    const user = makeUser();
    vi.mocked(repo.findById).mockResolvedValue(user as any);
    vi.mocked(repo.update).mockResolvedValue(undefined as any);

    await new ResetPasswordUseCase(repo).execute({ token: validToken, newPassword: 'newpass123' });

    expect(user.updatePasswordHash).toHaveBeenCalledWith('new-hashed-password');
    expect(repo.update).toHaveBeenCalled();

    const prisma = await import('@/infrastructure/database/prisma.service');
    expect(prisma.default.userSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });
});
