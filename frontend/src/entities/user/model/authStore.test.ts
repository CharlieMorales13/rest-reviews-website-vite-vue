import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import type { User } from './types';

vi.mock('../api/AuthService', () => ({
  AuthService: {
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    updateMe: vi.fn(),
  },
}));

import { AuthService } from '../api/AuthService';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const fakeUser: User = {
  id: 'u1',
  name: 'Carlos',
  username: 'carlos_gomez',
  email: 'carlos@anahuac.mx',
  role: 'student',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.mocked(AuthService.logout).mockResolvedValue(undefined);
    setActivePinia(createPinia());
  });

  // ── Initial state ────────────────────────────────────
  describe('initial state', () => {
    it('isAuthenticated is false when there is no user in localStorage', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('userRole is null when there is no user', () => {
      const store = useAuthStore();
      expect(store.userRole).toBeNull();
    });

    it('user is null', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('loading is false', () => {
      const store = useAuthStore();
      expect(store.loading).toBe(false);
    });

    it('error is null', () => {
      const store = useAuthStore();
      expect(store.error).toBeNull();
    });

    it('hydrates user from localStorage on init', () => {
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      setActivePinia(createPinia());
      const store = useAuthStore();
      expect(store.user).toEqual(fakeUser);
      expect(store.isAuthenticated).toBe(true);
    });
  });

  // ── login — happy path ──────────────────────────────
  describe('login — happy path', () => {
    beforeEach(() => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser },
      });
    });

    it('calls AuthService.login with the credentials', async () => {
      const store = useAuthStore();
      const creds = { email: 'carlos@anahuac.mx', password: 'carloscarlos' };
      await store.login(creds);
      expect(AuthService.login).toHaveBeenCalledWith(creds);
    });

    it('sets user from the response', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(store.user).toEqual(fakeUser);
    });

    it('saves user to localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(fakeUser));
    });

    it('does NOT save token or refreshToken to localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      const keys = vi.mocked(localStorageMock.setItem).mock.calls.map(([k]) => k);
      expect(keys).not.toContain('token');
      expect(keys).not.toContain('refreshToken');
    });

    it('isAuthenticated is true after login', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(store.isAuthenticated).toBe(true);
    });

    it('loading is false after login completes', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(store.loading).toBe(false);
    });
  });

  // ── login — error ───────────────────────────────────
  describe('login — error', () => {
    it('sets error with the message when AuthService.login throws', async () => {
      vi.mocked(AuthService.login).mockRejectedValue(new Error('Invalid credentials'));
      const store = useAuthStore();
      await expect(store.login({ email: 'bad@x.com', password: 'wrong' })).rejects.toThrow();
      expect(store.error).toBe('Invalid credentials');
    });

    it('re-throws the error', async () => {
      vi.mocked(AuthService.login).mockRejectedValue(new Error('boom'));
      const store = useAuthStore();
      await expect(store.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow('boom');
    });

    it('loading is false after error', async () => {
      vi.mocked(AuthService.login).mockRejectedValue(new Error('fail'));
      const store = useAuthStore();
      await expect(store.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow();
      expect(store.loading).toBe(false);
    });
  });

  // ── register ─────────────────────────────────────────
  describe('register — OTP flow', () => {
    const fakeRegisterData = { email: 'carlos@anahuac.mx', maskedEmail: 'c*****s@anahuac.mx' };

    beforeEach(() => {
      vi.mocked(AuthService.register).mockResolvedValue({
        success: true,
        message: 'ok',
        data: fakeRegisterData,
      });
    });

    it('calls AuthService.register with the request', async () => {
      const store = useAuthStore();
      const req = { name: 'Carlos', username: 'carlos_gomez', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' };
      await store.register(req);
      expect(AuthService.register).toHaveBeenCalledWith(req);
    });

    it('returns email and maskedEmail', async () => {
      const store = useAuthStore();
      const result = await store.register({ name: 'Carlos', username: 'carlos_gomez', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      expect(result.email).toBe('carlos@anahuac.mx');
      expect(result.maskedEmail).toBe('c*****s@anahuac.mx');
    });

    it('does NOT set user (pending verification)', async () => {
      const store = useAuthStore();
      await store.register({ name: 'Carlos', username: 'carlos_gomez', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  // ── verifyEmail ──────────────────────────────────────
  describe('verifyEmail', () => {
    beforeEach(() => {
      vi.mocked(AuthService.verifyEmail).mockResolvedValue({
        success: true,
        data: { user: fakeUser },
      });
    });

    it('calls AuthService.verifyEmail with email and code', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(AuthService.verifyEmail).toHaveBeenCalledWith({ email: 'carlos@anahuac.mx', code: '123456' });
    });

    it('sets user after verification', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(store.user).toEqual(fakeUser);
    });

    it('saves user to localStorage', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(fakeUser));
    });

    it('does NOT save token or refreshToken to localStorage', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      const keys = vi.mocked(localStorageMock.setItem).mock.calls.map(([k]) => k);
      expect(keys).not.toContain('token');
      expect(keys).not.toContain('refreshToken');
    });

    it('isAuthenticated is true after verification', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(store.isAuthenticated).toBe(true);
    });

    it('sets error and re-throws when verification fails', async () => {
      vi.mocked(AuthService.verifyEmail).mockRejectedValue(new Error('Invalid verification code'));
      const store = useAuthStore();
      await expect(store.verifyEmail('carlos@anahuac.mx', '999999')).rejects.toThrow('Invalid verification code');
      expect(store.error).toBe('Invalid verification code');
    });
  });

  // ── logout ──────────────────────────────────────────
  describe('logout', () => {
    beforeEach(() => {
      vi.mocked(AuthService.login).mockResolvedValue({ success: true, data: { user: fakeUser } });
    });

    it('calls AuthService.logout to clear the server-side cookie', async () => {
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      await store.logout();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    it('clears user to null', async () => {
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      await store.logout();
      expect(store.user).toBeNull();
    });

    it('removes user from localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      await store.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('isAuthenticated is false after logout', async () => {
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      await store.logout();
      expect(store.isAuthenticated).toBe(false);
    });

    it('does not throw if AuthService.logout fails (best-effort)', async () => {
      vi.mocked(AuthService.logout).mockRejectedValue(new Error('network error'));
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      await expect(store.logout()).resolves.not.toThrow();
      expect(store.user).toBeNull();
    });
  });

  // ── refreshSession ──────────────────────────────────
  describe('refreshSession', () => {
    it('calls AuthService.refresh with no arguments', async () => {
      vi.mocked(AuthService.refresh).mockResolvedValue(undefined);
      const store = useAuthStore();
      await store.refreshSession();
      expect(AuthService.refresh).toHaveBeenCalledWith();
    });

    it('resolves without throwing on success', async () => {
      vi.mocked(AuthService.refresh).mockResolvedValue(undefined);
      const store = useAuthStore();
      await expect(store.refreshSession()).resolves.not.toThrow();
    });

    it('throws when AuthService.refresh rejects', async () => {
      vi.mocked(AuthService.refresh).mockRejectedValue(new Error('refresh failed'));
      const store = useAuthStore();
      await expect(store.refreshSession()).rejects.toThrow('refresh failed');
    });
  });

  // ── initAuth ────────────────────────────────────────
  describe('initAuth', () => {
    it('does nothing when no user in localStorage', async () => {
      const store = useAuthStore();
      await store.initAuth();
      expect(AuthService.getMe).not.toHaveBeenCalled();
      expect(store.user).toBeNull();
    });

    it('calls AuthService.getMe to validate session when user is in localStorage', async () => {
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      vi.mocked(AuthService.getMe).mockResolvedValue(fakeUser);
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.initAuth();
      expect(AuthService.getMe).toHaveBeenCalled();
    });

    it('updates user with fresh data from getMe', async () => {
      const freshUser = { ...fakeUser, name: 'Carlos Updated' };
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      vi.mocked(AuthService.getMe).mockResolvedValue(freshUser);
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.initAuth();
      expect(store.user).toEqual(freshUser);
    });

    it('clears user when getMe fails (session invalid)', async () => {
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      vi.mocked(AuthService.getMe).mockRejectedValue(new Error('Unauthorized'));
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.initAuth();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  // ── fetchProfile ────────────────────────────────────
  describe('fetchProfile', () => {
    it('does not call AuthService.getMe when there is no user', async () => {
      const store = useAuthStore();
      await store.fetchProfile();
      expect(AuthService.getMe).not.toHaveBeenCalled();
    });

    it('calls AuthService.getMe and updates user when user exists', async () => {
      const freshUser = { ...fakeUser, name: 'Carlos Updated' };
      vi.mocked(AuthService.getMe).mockResolvedValue(freshUser);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.fetchProfile();
      expect(AuthService.getMe).toHaveBeenCalled();
      expect(store.user).toEqual(freshUser);
    });

    it('calls logout when getMe throws', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValue(new Error('expired'));
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.fetchProfile();
      expect(store.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  // ── updateProfile ───────────────────────────────────
  describe('updateProfile', () => {
    it('calls AuthService.updateMe and updates user', async () => {
      const updatedUser = { ...fakeUser, name: 'Carlos Nuevo' };
      vi.mocked(AuthService.updateMe).mockResolvedValue(updatedUser);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.updateProfile({ name: 'Carlos Nuevo' });
      expect(AuthService.updateMe).toHaveBeenCalledWith({ name: 'Carlos Nuevo' });
      expect(store.user).toEqual(updatedUser);
    });

    it('saves updated user to localStorage', async () => {
      const updatedUser = { ...fakeUser, bio: 'Hola' };
      vi.mocked(AuthService.updateMe).mockResolvedValue(updatedUser);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.updateProfile({ bio: 'Hola' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
    });
  });

  // ── userRole ────────────────────────────────────────
  describe('userRole', () => {
    it('returns the role when user is logged in', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: { ...fakeUser, role: 'admin' } },
      });
      const store = useAuthStore();
      await store.login({ email: 'admin@anahuac.mx', password: 'Admin2026!' });
      expect(store.userRole).toBe('admin');
    });

    it('returns null when there is no user', () => {
      const store = useAuthStore();
      expect(store.userRole).toBeNull();
    });
  });
});
