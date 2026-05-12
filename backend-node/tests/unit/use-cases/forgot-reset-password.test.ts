import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordUseCase } from '@/application/use-cases/auth/ForgotPasswordUseCase';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IEmailService } from '@/domain/services/IEmailService';
import { UserRole } from '@/domain/entities/User';

vi.mock('@/infrastructure/config/env.config', () => ({
  env: {
    JWT_SECRET: 'test-secret-for-tests',
    FRONTEND_URL: 'http://localhost:5173',
  },
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
    ...overrides,
  };
}

describe('ForgotPasswordUseCase', () => {
  let repo: IUserRepository;
  let emailService: IEmailService;

  beforeEach(() => {
    repo = { findByEmail: vi.fn() } as any;
    emailService = {
      sendVerificationCode: vi.fn(),
      sendPasswordResetLink: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('resolves without error when email does not exist (no info leak)', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(null);
    await expect(
      new ForgotPasswordUseCase(repo, emailService).execute('nobody@x.com')
    ).resolves.toBeUndefined();
    expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('sends reset email with jwt link when user exists', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser() as any);
    await new ForgotPasswordUseCase(repo, emailService).execute('carlos@anahuac.mx');
    expect(emailService.sendPasswordResetLink).toHaveBeenCalledWith(
      'carlos@anahuac.mx',
      'Carlos',
      expect.stringContaining('http://localhost:5173/reset-password?token=')
    );
  });

  it('link contains a valid JWT with purpose password-reset', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser() as any);
    let capturedLink = '';
    vi.mocked(emailService.sendPasswordResetLink).mockImplementation(
      async (_to, _name, link) => { capturedLink = link; }
    );
    await new ForgotPasswordUseCase(repo, emailService).execute('carlos@anahuac.mx');
    const token = capturedLink.split('token=')[1];
    const { default: jwt } = await import('jsonwebtoken');
    const payload = jwt.verify(token, 'test-secret-for-tests') as Record<string, unknown>;
    expect(payload.purpose).toBe('password-reset');
    expect(payload.userId).toBe('user-1');
  });
});
