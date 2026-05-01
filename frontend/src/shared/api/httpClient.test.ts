import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

const { mockLogout, mockPush } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({ logout: mockLogout }),
}));

vi.mock('@/app/router', () => ({
  router: {
    currentRoute: { value: { path: '/dashboard' } },
    push: mockPush,
  },
}));

import { httpClient } from './httpClient';
import { router } from '@/app/router';

// localStorage mock — jsdom environment may not expose getItem correctly
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('httpClient — interceptor 401', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpClient);
    mockLogout.mockClear();
    mockPush.mockClear();
    localStorageMock.clear();
    (router.currentRoute as any).value.path = '/dashboard';
  });

  afterEach(() => {
    mock.restore();
  });

  it('llama logout y redirige a /login cuando el servidor responde 401', async () => {
    mock.onGet('/api/test').reply(401);

    await expect(httpClient.get('/api/test')).rejects.toThrow();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('no redirige si el usuario ya está en /login', async () => {
    (router.currentRoute as any).value.path = '/login';
    mock.onGet('/api/test').reply(401);

    await expect(httpClient.get('/api/test')).rejects.toThrow();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('no hace nada cuando el error es 500 (no 401)', async () => {
    mock.onGet('/api/test').reply(500);

    await expect(httpClient.get('/api/test')).rejects.toThrow();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('no hace nada cuando el error es de red (sin response)', async () => {
    mock.onGet('/api/test').networkError();

    await expect(httpClient.get('/api/test')).rejects.toThrow();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
