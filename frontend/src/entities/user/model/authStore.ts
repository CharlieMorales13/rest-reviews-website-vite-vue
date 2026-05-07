import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '../api/AuthService';
import type { UpdateProfileRequest } from '../api/AuthService';
import type { User, LoginRequest, RegisterRequest } from './types';
import { extractErrorMessage } from '@/shared/lib/extractError';
import { isTokenExpired } from '@/shared/lib/jwt';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  const login = async (request: LoginRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.login(request);
      if (response.success && response.data) {
        user.value = response.data.user;
        token.value = response.data.token;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
        user.value = response.data.user;
        token.value = response.data.token;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const refreshSession = async (): Promise<string> => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) throw new Error('No refresh token available');
    const result = await AuthService.refresh(storedRefreshToken);
    token.value = result.token;
    localStorage.setItem('token', result.token);
    localStorage.setItem('refreshToken', result.refreshToken);
    return result.token;
  };

  const fetchProfile = async () => {
    if (!token.value) return;
    try {
      const freshUser = await AuthService.getMe();
      user.value = freshUser;
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch {
      logout();
    }
  };

  const updateProfile = async (payload: UpdateProfileRequest): Promise<void> => {
    const updated = await AuthService.updateMe(payload);
    user.value = updated;
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        if (isTokenExpired(storedToken)) {
          if (storedRefreshToken) {
            try {
              await refreshSession();
            } catch {
              logout();
              return;
            }
          } else {
            logout();
            return;
          }
        } else {
          token.value = storedToken;
        }
      } else {
        token.value = null;
      }

      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        user.value = JSON.parse(storedUser);
      } else {
        user.value = null;
      }
    } catch {
      logout();
    }
  };

  return {
    user,
    token,
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
