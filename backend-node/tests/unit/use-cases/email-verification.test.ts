import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerifyEmailUseCase } from '@/application/use-cases/auth/VerifyEmailUseCase';
import { ResendVerificationUseCase } from '@/application/use-cases/auth/ResendVerificationUseCase';
import { RegisterUserUseCase } from '@/application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '@/application/use-cases/auth/LoginUserUseCase';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IEmailService } from '@/domain/services/IEmailService';
import { UserRole } from '@/domain/entities/User';

vi.mock('@/infrastructure/database/prisma.service', () => ({
  default: {
    userSession: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/infrastructure/config/env.config', () => ({
  env: { JWT_SECRET: 'test-secret-for-tests', JWT_EXPIRES_IN: '24h' },
}));

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn().mockResolvedValue(true),
}));

const futureDate = new Date(Date.now() + 15 * 60 * 1000);
const pastDate = new Date(Date.now() - 60 * 1000);

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'test@anahuac.mx',
    name: 'Test User',
    username: 'testuser',
    role: UserRole.STUDENT,
    isActive: true,
    isVerified: false,
    verificationCode: '123456',
    verificationExpires: futureDate,
    passwordHash: 'hashed',
    verify: vi.fn(),
    setVerificationCode: vi.fn(),
    ...overrides,
  };
}

// ── VerifyEmailUseCase ─────────────────────────────────────────────────────────

describe('VerifyEmailUseCase', () => {
  let repo: IUserRepository;

  beforeEach(() => {
    repo = {
      findByEmail: vi.fn(),
      update: vi.fn(),
    } as any;
  });

  it('throws 400 when user not found', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(null);
    await expect(
      new VerifyEmailUseCase(repo).execute({ email: 'x@x.com', code: '123456' })
    ).rejects.toThrow('Invalid verification attempt');
  });

  it('throws 400 when already verified', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser({ isVerified: true }) as any);
    await expect(
      new VerifyEmailUseCase(repo).execute({ email: 'test@anahuac.mx', code: '123456' })
    ).rejects.toThrow('already verified');
  });

  it('throws 400 when code does not match', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser() as any);
    await expect(
      new VerifyEmailUseCase(repo).execute({ email: 'test@anahuac.mx', code: '999999' })
    ).rejects.toThrow('Invalid verification code');
  });

  it('throws 400 when code is expired', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser({ verificationExpires: pastDate }) as any);
    await expect(
      new VerifyEmailUseCase(repo).execute({ email: 'test@anahuac.mx', code: '123456' })
    ).rejects.toThrow('expired');
  });

  it('calls user.verify() and repo.update() on success', async () => {
    const user = makeUser();
    vi.mocked(repo.findByEmail).mockResolvedValue(user as any);
    vi.mocked(repo.update).mockResolvedValue(user as any);
    const result = await new VerifyEmailUseCase(repo).execute({ email: 'test@anahuac.mx', code: '123456' });
    expect(user.verify).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalled();
    expect(result.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.email).toBe('test@anahuac.mx');
  });
});

// ── ResendVerificationUseCase ──────────────────────────────────────────────────

describe('ResendVerificationUseCase', () => {
  let repo: IUserRepository;
  let emailService: IEmailService;

  beforeEach(() => {
    repo = { findByEmail: vi.fn(), update: vi.fn() } as any;
    emailService = { sendVerificationCode: vi.fn().mockResolvedValue(undefined) };
  });

  it('does nothing when user not found (no info leak)', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(null);
    await expect(
      new ResendVerificationUseCase(repo, emailService).execute('unknown@x.com')
    ).resolves.toBeUndefined();
    expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('throws 400 when email is already verified', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser({ isVerified: true }) as any);
    await expect(
      new ResendVerificationUseCase(repo, emailService).execute('test@anahuac.mx')
    ).rejects.toThrow('already verified');
  });

  it('sets new code, updates user, sends email', async () => {
    const user = makeUser();
    vi.mocked(repo.findByEmail).mockResolvedValue(user as any);
    vi.mocked(repo.update).mockResolvedValue(user as any);
    await new ResendVerificationUseCase(repo, emailService).execute('test@anahuac.mx');
    expect(user.setVerificationCode).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalled();
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      'test@anahuac.mx',
      'Test User',
      expect.stringMatching(/^\d{6}$/)
    );
  });
});

// ── RegisterUserUseCase (updated to OTP flow) ──────────────────────────────────

describe('RegisterUserUseCase — OTP flow', () => {
  let repo: IUserRepository;
  let emailService: IEmailService;

  beforeEach(() => {
    repo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByUsername: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockImplementation(async (u) => u),
    } as any;
    emailService = { sendVerificationCode: vi.fn().mockResolvedValue(undefined) };
  });

  it('returns email and maskedEmail (no JWT)', async () => {
    const result = await new RegisterUserUseCase(repo, emailService).execute({
      name: 'Ana López',
      username: 'ana_l',
      email: 'ana.lopez@anahuac.mx',
      password: 'pass123',
      carrera: 'Gastronomía',
    });
    expect(result.email).toBe('ana.lopez@anahuac.mx');
    expect(result.maskedEmail).toMatch(/^a\*+z@anahuac\.mx$/);
    expect((result as any).token).toBeUndefined();
  });

  it('sends verification email after saving user', async () => {
    await new RegisterUserUseCase(repo, emailService).execute({
      name: 'Ana López',
      username: 'ana_l',
      email: 'ana@anahuac.mx',
      password: 'pass123',
      carrera: 'Gastronomía',
    });
    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      'ana@anahuac.mx',
      'Ana López',
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it('throws 409 when email already exists', async () => {
    vi.mocked(repo.findByEmail).mockResolvedValue(makeUser() as any);
    await expect(
      new RegisterUserUseCase(repo, emailService).execute({
        name: 'Ana',
        username: 'ana',
        email: 'test@anahuac.mx',
        password: 'pass123',
        carrera: 'Gastronomía',
      })
    ).rejects.toThrow('already exists');
  });

  it('masks email correctly for short local part', async () => {
    const result = await new RegisterUserUseCase(repo, emailService).execute({
      name: 'Al',
      username: 'al_u',
      email: 'al@gmail.com',
      password: 'pass123',
      carrera: 'Otro',
    });
    expect(result.maskedEmail).toBe('a*@gmail.com');
  });
});

// ── LoginUserUseCase — EMAIL_NOT_VERIFIED guard ────────────────────────────────

describe('LoginUserUseCase — unverified email', () => {
  it('throws EMAIL_NOT_VERIFIED (403) when user is not verified', async () => {
    const repo: IUserRepository = {
      findByEmail: vi.fn().mockResolvedValue(makeUser({ isVerified: false }) as any),
      findByUsername: vi.fn().mockResolvedValue(null),
    } as any;
    await expect(
      new LoginUserUseCase(repo).execute({ email: 'test@anahuac.mx', password: 'pass' })
    ).rejects.toThrow('EMAIL_NOT_VERIFIED');
  });
});
