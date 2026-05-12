import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPage from './LoginPage.vue';

const mockPush = vi.fn();
const mockLogin = vi.fn();
const mockQuery: Record<string, string> = {};
const mockAuthState = { userRole: 'student' as string, error: null as string | null };

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockQuery }),
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    get userRole() { return mockAuthState.userRole; },
    get error() { return mockAuthState.error; },
  }),
}));

describe('LoginPage — navigation after login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.userRole = 'student';
    mockAuthState.error = null;
    mockLogin.mockResolvedValue(undefined);
    Object.keys(mockQuery).forEach(k => delete mockQuery[k]);
  });

  it('navigates to /dashboard when student logs in without redirect param', async () => {
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('carlos@test.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /manager when manager logs in without redirect param', async () => {
    mockAuthState.userRole = 'manager';
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('memo@test.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/manager');
  });

  it('navigates to /admin when admin logs in without redirect param', async () => {
    mockAuthState.userRole = 'admin';
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('admin@test.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('navigates to the redirect param URL instead of role dashboard', async () => {
    mockQuery.redirect = '/review/create/cuckoo-box';
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('carlos@test.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/review/create/cuckoo-box');
  });

  it('redirect param takes precedence even for manager role', async () => {
    mockAuthState.userRole = 'manager';
    mockQuery.redirect = '/review/create/delyfull';
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('memo@test.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/review/create/delyfull');
  });

  it('does not navigate when email is empty', async () => {
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not navigate when password is empty', async () => {
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('carlos@test.com');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not navigate when login throws', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="text"]').setValue('carlos@test.com');
    await wrapper.find('input[type="password"]').setValue('wrong');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
