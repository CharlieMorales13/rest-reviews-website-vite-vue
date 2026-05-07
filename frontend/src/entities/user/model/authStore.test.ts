import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import type { User } from './types';

// Mock AuthService
vi.mock('../api/AuthService', () => ({
  AuthService: {
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    refresh: vi.fn(),
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
  username: 'carlos_gomez',
  email: 'carlos@anahuac.mx',
  role: 'student',
};

function makeFakeToken(expOffsetSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const payload = btoa(JSON.stringify({ exp, sub: 'u1', role: 'student' }));
  return `header.${payload}.signature`;
}
const fakeToken = makeFakeToken(); // valid for 1 hour
const fakeRefreshToken = 'fake-refresh-token-xyz';

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
        data: { user: fakeUser, token: fakeToken, refreshToken: fakeRefreshToken },
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

    it('saves refreshToken to localStorage', async () => {
      const store = useAuthStore();
      await store.login({ email: 'carlos@anahuac.mx', password: 'carloscarlos' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', fakeRefreshToken);
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

  // ── register — OTP flow ─────────────────────────────
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

    it('does NOT set token or user (pending verification)', async () => {
      const store = useAuthStore();
      await store.register({ name: 'Carlos', username: 'carlos_gomez', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
    });

    it('does NOT save token to localStorage', async () => {
      const store = useAuthStore();
      await store.register({ name: 'Carlos', username: 'carlos_gomez', email: 'carlos@anahuac.mx', password: 'pw', carrera: 'ISC' });
      const setItemCalls = vi.mocked(localStorageMock.setItem).mock.calls;
      expect(setItemCalls.some(([k]) => k === 'token')).toBe(false);
    });
  });

  // ── verifyEmail ──────────────────────────────────────
  describe('verifyEmail', () => {
    beforeEach(() => {
      vi.mocked(AuthService.verifyEmail).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken, refreshToken: fakeRefreshToken },
      });
    });

    it('calls AuthService.verifyEmail with email and code', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(AuthService.verifyEmail).toHaveBeenCalledWith({ email: 'carlos@anahuac.mx', code: '123456' });
    });

    it('sets user and token after verification', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(store.user).toEqual(fakeUser);
      expect(store.token).toBe(fakeToken);
    });

    it('saves token and refreshToken to localStorage', async () => {
      const store = useAuthStore();
      await store.verifyEmail('carlos@anahuac.mx', '123456');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', fakeToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', fakeRefreshToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(fakeUser));
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
    it('clears user to null', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken, refreshToken: fakeRefreshToken },
      });
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      store.logout();
      expect(store.user).toBeNull();
    });

    it('clears token to null', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken, refreshToken: fakeRefreshToken },
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

    it('removes refreshToken from localStorage', () => {
      const store = useAuthStore();
      store.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('removes user from localStorage', () => {
      const store = useAuthStore();
      store.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('isAuthenticated is false after logout', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        success: true,
        data: { user: fakeUser, token: fakeToken, refreshToken: fakeRefreshToken },
      });
      const store = useAuthStore();
      await store.login({ email: 'a@b.c', password: 'x' });
      store.logout();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  // ── refreshSession ──────────────────────────────────
  describe('refreshSession', () => {
    it('throws when there is no refresh token in localStorage', async () => {
      const store = useAuthStore();
      await expect(store.refreshSession()).rejects.toThrow('No refresh token available');
    });

    it('calls AuthService.refresh with the stored refresh token', async () => {
      const newToken = makeFakeToken(3600);
      const newRefresh = 'new-refresh-token';
      vi.mocked(AuthService.refresh).mockResolvedValue({ token: newToken, refreshToken: newRefresh });

      localStorageMock.setItem('refreshToken', fakeRefreshToken);
      const store = useAuthStore();
      await store.refreshSession();

      expect(AuthService.refresh).toHaveBeenCalledWith(fakeRefreshToken);
    });

    it('updates token in store and localStorage', async () => {
      const newToken = makeFakeToken(3600);
      const newRefresh = 'new-refresh-token';
      vi.mocked(AuthService.refresh).mockResolvedValue({ token: newToken, refreshToken: newRefresh });

      localStorageMock.setItem('refreshToken', fakeRefreshToken);
      const store = useAuthStore();
      await store.refreshSession();

      expect(store.token).toBe(newToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', newToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', newRefresh);
    });

    it('returns the new access token', async () => {
      const newToken = makeFakeToken(3600);
      vi.mocked(AuthService.refresh).mockResolvedValue({ token: newToken, refreshToken: 'new-rt' });

      localStorageMock.setItem('refreshToken', fakeRefreshToken);
      const store = useAuthStore();
      const result = await store.refreshSession();

      expect(result).toBe(newToken);
    });
  });

  // ── initAuth ────────────────────────────────────────
  describe('initAuth', () => {
    it('loads token and user from localStorage when valid', async () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      vi.clearAllMocks();

      const store = useAuthStore();
      await store.initAuth();
      expect(store.token).toBe(fakeToken);
      expect(store.user).toEqual(fakeUser);
    });

    it('isAuthenticated is true after initAuth with valid token', async () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      const store = useAuthStore();
      await store.initAuth();
      expect(store.isAuthenticated).toBe(true);
    });

    it('leaves token as null when localStorage has "undefined"', async () => {
      localStorageMock.setItem('token', 'undefined');

      const store = useAuthStore();
      await store.initAuth();
      expect(store.token).toBeNull();
    });

    it('leaves token as null when localStorage has "null"', async () => {
      localStorageMock.setItem('token', 'null');

      const store = useAuthStore();
      await store.initAuth();
      expect(store.token).toBeNull();
    });

    it('calls logout (cleans state) when user JSON is invalid', async () => {
      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', '{invalid json');

      const store = useAuthStore();
      await store.initAuth();
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
    });

    it('clears token and user when token is expired and no refresh token exists', async () => {
      const expiredToken = makeFakeToken(-3600);
      localStorageMock.setItem('token', expiredToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      const store = useAuthStore();
      await store.initAuth();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('silently refreshes when access token is expired but refresh token exists', async () => {
      const expiredToken = makeFakeToken(-3600);
      const newToken = makeFakeToken(3600);
      const newRefresh = 'rotated-refresh-token';

      localStorageMock.setItem('token', expiredToken);
      localStorageMock.setItem('refreshToken', fakeRefreshToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      vi.mocked(AuthService.refresh).mockResolvedValue({ token: newToken, refreshToken: newRefresh });

      const store = useAuthStore();
      await store.initAuth();

      expect(AuthService.refresh).toHaveBeenCalledWith(fakeRefreshToken);
      expect(store.token).toBe(newToken);
      expect(store.isAuthenticated).toBe(true);
    });

    it('logs out when both access token and refresh token are expired', async () => {
      const expiredToken = makeFakeToken(-3600);

      localStorageMock.setItem('token', expiredToken);
      localStorageMock.setItem('refreshToken', fakeRefreshToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      vi.mocked(AuthService.refresh).mockRejectedValue(new Error('Refresh token expired'));

      const store = useAuthStore();
      await store.initAuth();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
    });

    it('clears token and user when stored token is malformed', async () => {
      localStorageMock.setItem('token', 'malformed-not-a-jwt');
      localStorageMock.setItem('user', JSON.stringify(fakeUser));

      const store = useAuthStore();
      await store.initAuth();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
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
      await store.initAuth();
      await store.fetchProfile();

      expect(AuthService.getMe).toHaveBeenCalled();
      expect(store.user).toEqual(freshUser);
    });

    it('calls logout when getMe throws', async () => {
      vi.mocked(AuthService.getMe).mockRejectedValue(new Error('expired'));

      localStorageMock.setItem('token', fakeToken);
      localStorageMock.setItem('user', JSON.stringify(fakeUser));
      const store = useAuthStore();
      await store.initAuth();

      await store.fetchProfile();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
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
        data: { user: { ...fakeUser, role: 'admin' }, token: fakeToken, refreshToken: fakeRefreshToken },
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
