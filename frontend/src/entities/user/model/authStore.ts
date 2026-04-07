import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '../api/AuthService';
import type { UpdateProfileRequest } from '../api/AuthService';
import type { User, LoginRequest, RegisterRequest } from './types';

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
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error occurred during login';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (request: RegisterRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.register(request);
      if (response.success && response.data) {
        const newUser = response.data.user;
        const newToken = response.data.token;
        
        user.value = newUser;
        token.value = newToken;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
        }
        
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error occurred during registration';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchProfile = async () => {
    if (!token.value) return;
    try {
      const freshUser = await AuthService.getMe();
      user.value = freshUser;
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch {
      // Si falla (token expirado, etc.) no interrumpir la sesión
    }
  };

  const updateProfile = async (payload: UpdateProfileRequest): Promise<void> => {
    const updated = await AuthService.updateMe(payload);
    user.value = updated;
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const initAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        token.value = storedToken;
      } else {
        token.value = null;
      }

      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        user.value = JSON.parse(storedUser);
      } else {
        user.value = null;
      }
    } catch (err) {
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
    logout,
    initAuth,
    fetchProfile,
    updateProfile,
  };
});
