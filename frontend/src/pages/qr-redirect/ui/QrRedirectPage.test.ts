import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QrRedirectPage from './QrRedirectPage.vue';

const mockReplace = vi.fn();
const mockAuthStore = { isAuthenticated: false, userRole: null as string | null };

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { slug: 'cuckoo-box' } }),
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

describe('QrRedirectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.userRole = null;
  });

  it('redirects authenticated student directly to create-review page', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.userRole = 'student';
    mount(QrRedirectPage);
    await new Promise(r => setTimeout(r, 10));
    expect(mockReplace).toHaveBeenCalledWith('/review/create/cuckoo-box');
  });

  it('redirects unauthenticated user to login with encoded redirect param', async () => {
    mockAuthStore.isAuthenticated = false;
    mount(QrRedirectPage);
    await new Promise(r => setTimeout(r, 10));
    expect(mockReplace).toHaveBeenCalledWith(
      '/login?redirect=%2Freview%2Fcreate%2Fcuckoo-box'
    );
  });

  it('redirects authenticated manager to login with redirect param', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.userRole = 'manager';
    mount(QrRedirectPage);
    await new Promise(r => setTimeout(r, 10));
    expect(mockReplace).toHaveBeenCalledWith(
      '/login?redirect=%2Freview%2Fcreate%2Fcuckoo-box'
    );
  });

  it('redirects authenticated admin to login with redirect param', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.userRole = 'admin';
    mount(QrRedirectPage);
    await new Promise(r => setTimeout(r, 10));
    expect(mockReplace).toHaveBeenCalledWith(
      '/login?redirect=%2Freview%2Fcreate%2Fcuckoo-box'
    );
  });

  it('uses slug from route params in the destination URL', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.userRole = 'student';
    mount(QrRedirectPage);
    await new Promise(r => setTimeout(r, 10));
    const call = mockReplace.mock.calls[0][0] as string;
    expect(call).toContain('cuckoo-box');
  });
});
