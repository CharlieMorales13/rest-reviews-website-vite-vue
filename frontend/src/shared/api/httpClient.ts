import axios from 'axios';
import { router } from '@/app/router';
import { useAuthStore } from '@/entities/user/model/authStore';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request: inject JWT ─────────────────────────────────────────────────────
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lazy singleton — avoids calling useAuthStore() before Pinia is installed
let _authStore: ReturnType<typeof useAuthStore> | null = null;
const getAuthStore = () => {
  if (!_authStore) _authStore = useAuthStore();
  return _authStore;
};

// ── Response: handle expired / invalid token ────────────────────────────────
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      getAuthStore().logout();
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }
    return Promise.reject(error);
  },
);
