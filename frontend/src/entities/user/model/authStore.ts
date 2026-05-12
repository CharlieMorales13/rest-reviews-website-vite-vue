import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '../api/AuthService';
import type { UpdateProfileRequest } from '../api/AuthService';
import type { User, LoginRequest, RegisterRequest } from './types';
import { extractErrorMessage } from '@/shared/lib/extractError';

export const useAuthStore = defineStore('auth', () => {
  // user is non-sensitive — safe to keep in localStorage for instant hydration
  const storedUser = localStorage.getItem('user');
  const user = ref<User | null>(
    storedUser && storedUser !== 'undefined' && storedUser !== 'null'
      ? (JSON.parse(storedUser) as User)
      : null,
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  // isAuthenticated is derived from user presence in memory
  const isAuthenticated = computed(() => !!user.value);
  const userRole = computed(() => user.value?.role || null);

  const _persistUser = (u: User | null) => {
    user.value = u;
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  const login = async (request: LoginRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.login(request);
      if (response.success && response.data) {
        _persistUser(response.data.user);
      }
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Error occurred during login');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (request: RegisterRequest): Promise<{ email: string; maskedEmail: string }> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.register(request);
      return response.data;
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Error occurred during registration');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.verifyEmail({ email, code });
      if (response.success && response.data) {
        _persistUser(response.data.user);
      }
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Error occurred during verification');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resendVerification = async (email: string): Promise<void> => {
    await AuthService.resendVerification(email);
  };

  const logout = async () => {
    try { await AuthService.logout(); } catch { /* cookie cleared server-side best-effort */ }
    _persistUser(null);
  };

  // Triggers a cookie rotation server-side; no token returned
  const refreshSession = async (): Promise<void> => {
    await AuthService.refresh();
  };

  const fetchProfile = async () => {
    if (!user.value) return;
    try {
      const freshUser = await AuthService.getMe();
      _persistUser(freshUser);
    } catch {
      await logout();
    }
  };

  const updateProfile = async (payload: UpdateProfileRequest): Promise<void> => {
    const updated = await AuthService.updateMe(payload);
    _persistUser(updated);
  };

  const initAuth = async () => {
    // User object from localStorage gives instant hydration (no flash of unauthenticated state).
    // Then validate the session against the server — if the cookie is gone/expired,
    // the 401 interceptor will attempt a refresh; if that fails too, logout() is called.
    if (!user.value) return;
    try {
      const freshUser = await AuthService.getMe();
      _persistUser(freshUser);
    } catch {
      _persistUser(null);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    refreshSession,
    initAuth,
    fetchProfile,
    updateProfile,
  };
});
