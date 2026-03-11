import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginRequest, RegisterRequest } from '../../core/types/auth';
import { AuthService } from '../../infrastructure/services/AuthService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  const login = async (request: LoginRequest) => {
    error.value = null;
    try {
      // Mock Login bypass for testing
      if (request.email === 'admin@anahuac.mx' && request.password === 'admin123') {
        const mockUser: User = {
          id: '00458921',
          name: 'Sebastián Morales',
          email: request.email,
          role: 'student',
        };
        const mockToken = 'mock-jwt-token-12345';
        
        user.value = mockUser;
        token.value = mockToken;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return;
      }

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
    }
  };

  const register = async (request: RegisterRequest) => {
    error.value = null;
    try {
      await AuthService.register(request);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error occurred during registration';
      throw err;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const initAuth = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }
  };

  return { user, token, error, isAuthenticated, userRole, login, register, logout, initAuth };
});
