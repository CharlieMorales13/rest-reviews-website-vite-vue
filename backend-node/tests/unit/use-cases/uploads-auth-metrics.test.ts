import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { UploadFileUseCase } from '@/application/use-cases/uploads/UploadFileUseCase';
import { ChangePasswordUseCase } from '@/application/use-cases/auth/ChangePasswordUseCase';
import { GetEstablishmentMetricsUseCase } from '@/application/use-cases/metrics/GetEstablishmentMetricsUseCase';
import { DeleteEstablishmentUseCase } from '@/application/use-cases/establishments/DeleteEstablishmentUseCase';
import { IStorageService } from '@/domain/services/IStorageService';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';

// ─── UploadFileUseCase ────────────────────────────────────────────────────────

describe('UploadFileUseCase', () => {
  const mockStorage = (url = 'https://cdn.example.com/file.jpg'): IStorageService =>
    ({ uploadFile: vi.fn().mockResolvedValue(url) } as any);

  it('uploads file and returns URL', async () => {
    const result = await new UploadFileUseCase(mockStorage()).execute(
      Buffer.from('data'), 'photo.jpg', 'reviews', 'image/jpeg'
    );
    expect(result).toBe('https://cdn.example.com/file.jpg');
  });

  it('handles file with no extension gracefully', async () => {
    const svc = mockStorage('https://cdn.example.com/file.jpg');
    await new UploadFileUseCase(svc).execute(Buffer.from('x'), 'noextfile', 'bucket', 'image/jpeg');
    const [, name] = (svc.uploadFile as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(name).toMatch(/\.jpg$/);
  });

  it('throws 400 when file buffer is falsy', async () => {
    await expect(
      new UploadFileUseCase(mockStorage()).execute(null as any, 'a.jpg', 'b', 'image/jpeg')
    ).rejects.toThrow('File is required');
  });

  it('throws 400 when extension is not allowed', async () => {
    await expect(
      new UploadFileUseCase(mockStorage()).execute(Buffer.from('data'), 'exploit.html', 'bucket', 'image/png')
    ).rejects.toThrow('Formato de archivo no permitido');
  });
});

// ─── ChangePasswordUseCase ────────────────────────────────────────────────────

describe('ChangePasswordUseCase', () => {
  it('throws 404 when user not found', async () => {
    const repo: IUserRepository = { findById: vi.fn().mockResolvedValue(null) } as any;
    await expect(
      new ChangePasswordUseCase(repo).execute('bad-id', { currentPassword: 'a', newPassword: 'b' })
    ).rejects.toThrow('User not found');
  });
});

// ─── GetEstablishmentMetricsUseCase ───────────────────────────────────────────

describe('GetEstablishmentMetricsUseCase', () => {
  it('throws 404 when establishment not found', async () => {
    const estRepo: IEstablishmentRepository = { findById: vi.fn().mockResolvedValue(null) } as any;
    const metricsRepo: IMetricsRepository = {} as any;
    await expect(
      new GetEstablishmentMetricsUseCase(metricsRepo, estRepo).execute('bad-id')
    ).rejects.toThrow('Establishment not found');
  });

  it('throws 404 when metrics not found', async () => {
    const estRepo: IEstablishmentRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'est-1' }),
    } as any;
    const metricsRepo: IMetricsRepository = {
      getEstablishmentSummary: vi.fn().mockResolvedValue(null),
    } as any;
    await expect(
      new GetEstablishmentMetricsUseCase(metricsRepo, estRepo).execute('est-1')
    ).rejects.toThrow('Establishment metrics not found');
  });

  it('returns metrics when found', async () => {
    const summary = { establishmentId: 'est-1', avgRating: 4.5 };
    const estRepo: IEstablishmentRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'est-1' }),
    } as any;
    const metricsRepo: IMetricsRepository = {
      getEstablishmentSummary: vi.fn().mockResolvedValue(summary),
    } as any;
    const result = await new GetEstablishmentMetricsUseCase(metricsRepo, estRepo).execute('est-1');
    expect(result.avgRating).toBe(4.5);
  });
});

// ─── DeleteEstablishmentUseCase ───────────────────────────────────────────────

describe('DeleteEstablishmentUseCase', () => {
  const makeRepo = (est: any): IEstablishmentRepository =>
    ({ findById: vi.fn().mockResolvedValue(est), delete: vi.fn().mockResolvedValue(undefined) } as any);

  it('throws 404 when establishment not found', async () => {
    const repo = makeRepo(null);
    await expect(new DeleteEstablishmentUseCase(repo).execute('bad')).rejects.toThrow('Establishment not found');
  });

  it('throws 403 when non-admin non-manager requester', async () => {
    const est = { id: 'est-1', managerId: 'manager-2' };
    const repo = makeRepo(est);
    await expect(
      new DeleteEstablishmentUseCase(repo).execute('est-1', { id: 'user-99', role: 'student' })
    ).rejects.toThrow('permission');
  });

  it('allows admin to delete any establishment', async () => {
    const repo = makeRepo({ id: 'est-1', managerId: 'mgr-1' });
    await new DeleteEstablishmentUseCase(repo).execute('est-1', { id: 'admin-1', role: 'admin' });
    expect(repo.delete).toHaveBeenCalledWith('est-1');
  });

  it('allows manager to delete their own establishment', async () => {
    const repo = makeRepo({ id: 'est-1', managerId: 'mgr-1' });
    await new DeleteEstablishmentUseCase(repo).execute('est-1', { id: 'mgr-1', role: 'manager' });
    expect(repo.delete).toHaveBeenCalled();
  });

  it('deletes without requester check when requester is omitted', async () => {
    const repo = makeRepo({ id: 'est-1' });
    await new DeleteEstablishmentUseCase(repo).execute('est-1');
    expect(repo.delete).toHaveBeenCalled();
  });
});
