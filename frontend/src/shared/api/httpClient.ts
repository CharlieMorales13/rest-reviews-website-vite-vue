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

// ── Response: silent token refresh on 401 ──────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (err: unknown, newToken: string | null = null) => {
  failedQueue.forEach(p => err ? p.reject(err) : p.resolve(newToken!));
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't retry: non-401, already-retried, or the refresh call itself
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh')
    ) {
      if (error.response?.status === 401) {
        getAuthStore().logout();
        if (router.currentRoute.value.path !== '/login') router.push('/login');
      }
      return Promise.reject(error);
    }

    // If another refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newToken = await getAuthStore().refreshSession();
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return httpClient(original);
    } catch (refreshError) {
      processQueue(refreshError);
      getAuthStore().logout();
      if (router.currentRoute.value.path !== '/login') router.push('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
