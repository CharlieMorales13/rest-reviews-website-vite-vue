import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import type { User } from './types';

// Mock AuthService
vi.mock('../api/AuthService', () => ({
  AuthService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    updateMe: vi.fn(),
  },
}));

import { AuthService } from '../api/AuthService';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helpers
const fakeUser: User = {
  id: 'u1',
  name: 'Carlos',
  email: 'carlos@anahuac.mx',
  role: 'student',
};

const fakeToken = 'jwt-token-123';

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  // ── Initial state ────────────────────────────────────
  describe('initial state', () => {
    it('isAuthenticated is false when there is no token', () => {
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
  });

  // ── login — happy path ──────────────────────────────
  describe('login — happy path', () => {
    beforeEach(() => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken },
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

    it('sets token from the response', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(store.token).toBe(fakeToken);
    });

    it('saves token to localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', fakeToken);
    });

    it('saves user to localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(fakeUser));
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
      const err = new Error('boom');
      vi.mocked(AuthService.login).mockRejectedValue(err);
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

  // ── register — happy path ───────────────────────────
  describe('register — happy path', () => {
    beforeEach(() => {
      vi.mocked(AuthService.register).mockResolvedValue({
        success: true,
        message: 'ok',
        data: { user: fakeUser, token: fakeToken },
      });
    });

    it('calls AuthService.register', async () => {
      const store = useAuthStore();
      const req = { name: 'Carlos', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' };
      await store.register(req);
      expect(AuthService.register).toHaveBeenCalledWith(req);
    });

    it('sets user and token', async () => {
      const store = useAuthStore();
      await store.register({ name: 'Carlos', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      expect(store.user).toEqual(fakeUser);
      expect(store.token).toBe(fakeToken);
    });

    it('saves to localStorage', async () => {
      const store = useAuthStore();
      await store.register({ name: 'Carlos', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', fakeToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(fakeUser));
    });
  });

  // ── logout ──────────────────────────────────────────
  describe('logout', () => {
    it('clears user to null', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken },
      });
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      store.logout();
      expect(store.user).toBeNull();
    });

    it('clears token to null', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken },
      });
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      store.logout();
      expect(store.token).toBeNull();
    });

    it('removes token from localStorage', () => {
      const store = useAuthStore();
      store.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('removes user from localStorage', () => {
      const store = useAuthStore();
      store.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('isAuthenticated is false after logout', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken },
      });
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      store.logout();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  // ── initAuth ────────────────────────────────────────
  describe('initAuth', () => {
    it('loads token and user from localStorage when valid', () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      vi.clearAllMocks(); // clear setItem tracking from setup

      const store = useAuthStore();
      store.initAuth();
      expect(store.token).toBe(fakeToken);
      expect(store.user).toEqual(fakeUser);
    });

    it('isAuthenticated is true after initAuth with valid token', () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      const store = useAuthStore();
      store.initAuth();
      expect(store.isAuthenticated).toBe(true);
    });

    it('leaves token as null when localStorage has "undefined"', () => {
      localStorageMock.setItem('token', 'undefined');

      const store = useAuthStore();
      store.initAuth();
      expect(store.token).toBeNull();
    });

    it('leaves token as null when localStorage has "null"', () => {
      localStorageMock.setItem('token', 'null');

      const store = useAuthStore();
      store.initAuth();
      expect(store.token).toBeNull();
    });

    it('calls logout (cleans state) when user JSON is invalid', () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', '{invalid json');

      const store = useAuthStore();
      store.initAuth();
      // After catch → logout → state is clean
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
    });
  });

  // ── fetchProfile ────────────────────────────────────
  describe('fetchProfile', () => {
    it('does not call AuthService.getMe when there is no token', async () => {
      const store = useAuthStore();
      await store.fetchProfile();
      expect(AuthService.getMe).not.toHaveBeenCalled();
    });

    it('calls AuthService.getMe and updates user when token exists', async () => {
      const freshUser = { ...fakeUser, name: 'Carlos Updated' };
      vi.mocked(AuthService.getMe).mockResolvedValue(freshUser);

      localStorageMock.setItem('token', fakeToken);
      const store = useAuthStore();
      store.initAuth();
      await store.fetchProfile();

      expect(AuthService.getMe).toHaveBeenCalled();
      expect(store.user).toEqual(freshUser);
    });

    it('does not interrupt the session when getMe throws', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValue(new Error('expired'));

      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      const store = useAuthStore();
      store.initAuth();

      // Should not throw
      await store.fetchProfile();
      // Token should still be there (session not interrupted)
      expect(store.token).toBe(fakeToken);
    });
  });

  // ── updateProfile ───────────────────────────────────
  describe('updateProfile', () => {
    it('calls AuthService.updateMe and updates user', async () => {
      const updatedUser = { ...fakeUser, name: 'Carlos Nuevo' };
      vi.mocked(AuthService.updateMe).mockResolvedValue(updatedUser);

      const store = useAuthStore();
      store.user = fakeUser;
      store.token = fakeToken;

      await store.updateProfile({ name: 'Carlos Nuevo' });

      expect(AuthService.updateMe).toHaveBeenCalledWith({ name: 'Carlos Nuevo' });
      expect(store.user).toEqual(updatedUser);
    });

    it('saves updated user to localStorage', async () => {
      const updatedUser = { ...fakeUser, bio: 'Hola' };
      vi.mocked(AuthService.updateMe).mockResolvedValue(updatedUser);

      const store = useAuthStore();
      store.user = fakeUser;
      store.token = fakeToken;

      await store.updateProfile({ bio: 'Hola' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
    });
  });

  // ── userRole ────────────────────────────────────────
  describe('userRole', () => {
    it('returns the role when user is logged in', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: { ...fakeUser, role: 'admin' }, token: fakeToken },
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
