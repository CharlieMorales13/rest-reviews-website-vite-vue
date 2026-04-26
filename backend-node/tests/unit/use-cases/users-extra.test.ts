import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { AdminCreateUserUseCase } from '@/application/use-cases/users/AdminCreateUserUseCase';
import { UpdateUserUseCase } from '@/application/use-cases/users/UpdateUserUseCase';
import { GetUserUseCase } from '@/application/use-cases/users/GetUserUseCase';
import { ListUsersUseCase } from '@/application/use-cases/users/ListUsersUseCase';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';
import { UserRole } from '@/domain/entities/User';

const mockUser = (overrides = {}) => ({
  id: 'u-1',
  name: 'Test User',
  email: 'test@anahuac.mx',
  passwordHash: 'hash',
  role: UserRole.STUDENT,
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('GetUserUseCase', () => {
  it('returns user when found', async () => {
    const repo: IUserRepository = { findById: vi.fn().mockResolvedValue(mockUser()) } as any;
    const result = await new GetUserUseCase(repo).execute('u-1');
    expect(result.id).toBe('u-1');
  });

  it('throws 404 when not found', async () => {
    const repo: IUserRepository = { findById: vi.fn().mockResolvedValue(null) } as any;
    await expect(new GetUserUseCase(repo).execute('bad')).rejects.toThrow('User not found');
  });
});

describe('ListUsersUseCase', () => {
  it('returns list of users', async () => {
    const repo: IUserRepository = { findAll: vi.fn().mockResolvedValue([mockUser()]) } as any;
    const result = await new ListUsersUseCase(repo).execute();
    expect(result).toHaveLength(1);
  });
});

describe('AdminCreateUserUseCase', () => {
  const makeRepos = (existing: any = null, savedUser: any = mockUser()) => ({
    userRepo: {
      findByEmail: vi.fn().mockResolvedValue(existing),
      findByUsername: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(savedUser),
    } as any as IUserRepository,
    estRepo: {
      findById: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    } as any as IEstablishmentRepository,
  });

  it('throws 409 when email already exists', async () => {
    const { userRepo, estRepo } = makeRepos(mockUser());
    await expect(
      new AdminCreateUserUseCase(userRepo, estRepo).execute({
        name: 'N', email: 'existing@test.mx', password: 'pass', role: UserRole.STUDENT,
      })
    ).rejects.toThrow('Ya existe una cuenta con ese correo electrónico');
  });

  it('creates a student user successfully', async () => {
    const { userRepo, estRepo } = makeRepos(null, mockUser({ id: 'u-1', role: UserRole.STUDENT }));
    const result = await new AdminCreateUserUseCase(userRepo, estRepo).execute({
      name: 'Carlos', email: 'new@anahuac.mx', password: 'pass123', role: UserRole.STUDENT,
    });
    expect(result.id).toBe('u-1');
    expect(result.role).toBe(UserRole.STUDENT);
    expect(result.establishmentId).toBeNull();
  });

  it('assigns establishment when creating manager', async () => {
    const est = {
      id: 'est-1', name: 'DelyFull', managerId: null,
      assignManager: vi.fn(), update: vi.fn(),
    };
    const userRepo: IUserRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByUsername: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(mockUser({ id: 'u-2', role: UserRole.MANAGER })),
    } as any;
    const estRepo: IEstablishmentRepository = {
      findById: vi.fn().mockResolvedValue(est),
      update: vi.fn().mockResolvedValue({ id: 'est-1', name: 'DelyFull' }),
    } as any;
    const result = await new AdminCreateUserUseCase(userRepo, estRepo).execute({
      name: 'Memo', email: 'memo@anahuac.mx', password: 'pass123',
      role: UserRole.MANAGER, establishmentId: 'est-1',
    });
    expect(est.assignManager).toHaveBeenCalledWith('u-2');
    expect(result.establishmentName).toBe('DelyFull');
  });

  it('throws 404 when establishment not found for manager', async () => {
    const { userRepo, estRepo } = makeRepos(null, mockUser({ id: 'u-3', role: UserRole.MANAGER }));
    await expect(
      new AdminCreateUserUseCase(userRepo, estRepo).execute({
        name: 'X', email: 'x@anahuac.mx', password: 'pass', role: UserRole.MANAGER, establishmentId: 'bad-id',
      })
    ).rejects.toThrow('Establecimiento no encontrado');
  });
});

describe('UpdateUserUseCase', () => {
  it('throws 404 when user not found', async () => {
    const userRepo: IUserRepository = { findById: vi.fn().mockResolvedValue(null) } as any;
    const estRepo: IEstablishmentRepository = {} as any;
    await expect(
      new UpdateUserUseCase(userRepo, estRepo).execute('bad-id', { name: 'New' })
    ).rejects.toThrow('User not found');
  });

  it('updates user without changing password', async () => {
    const existing = mockUser();
    const updated = mockUser({ name: 'Updated' });
    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    } as any;
    const estRepo: IEstablishmentRepository = {} as any;
    const result = await new UpdateUserUseCase(userRepo, estRepo).execute('u-1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('assigns establishment when establishmentId provided', async () => {
    const existing = mockUser({ role: UserRole.MANAGER });
    const est = { id: 'est-1', name: 'DelyFull', assignManager: vi.fn() };
    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    } as any;
    const estRepo: IEstablishmentRepository = {
      findById: vi.fn().mockResolvedValue(est),
      update: vi.fn().mockResolvedValue(est),
    } as any;
    await new UpdateUserUseCase(userRepo, estRepo).execute('u-1', { establishmentId: 'est-1' });
    expect(est.assignManager).toHaveBeenCalledWith('u-1');
  });

  it('throws 404 when establishment not found', async () => {
    const existing = mockUser({ role: UserRole.MANAGER });
    const userRepo: IUserRepository = {
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    } as any;
    const estRepo: IEstablishmentRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as any;
    await expect(
      new UpdateUserUseCase(userRepo, estRepo).execute('u-1', { establishmentId: 'bad' })
    ).rejects.toThrow('Establecimiento no encontrado');
  });
});
