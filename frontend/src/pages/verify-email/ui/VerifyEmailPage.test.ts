import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VerifyEmailPage from './VerifyEmailPage.vue';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();
const mockQuery: Record<string, string> = {};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute: () => ({ query: mockQuery }),
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({
    verifyEmail: mockVerifyEmail,
    resendVerification: mockResendVerification,
    userRole: 'student',
    error: null,
  }),
}));

vi.mock('@/shared/ui/OtpInput.vue', () => ({
  default: {
    name: 'OtpInput',
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: '<input data-testid="otp" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyEmail.mockResolvedValue(undefined);
    mockResendVerification.mockResolvedValue(undefined);
    Object.keys(mockQuery).forEach(k => delete mockQuery[k]);
  });

  it('redirects to /register when no email query param', async () => {
    mount(VerifyEmailPage);
    await new Promise(r => setTimeout(r, 10));
    expect(mockReplace).toHaveBeenCalledWith('/register');
  });

  it('shows the masked email in the page text', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    const wrapper = mount(VerifyEmailPage);
    // VerifyEmailPage masks the email before displaying it
    expect(wrapper.text()).toContain('c****s@anahuac.mx');
  });

  it('calls verifyEmail with email and code on submit', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    const wrapper = mount(VerifyEmailPage);
    await wrapper.find('[data-testid="otp"]').setValue('123456');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockVerifyEmail).toHaveBeenCalledWith('carlos@anahuac.mx', '123456');
  });

  it('redirects to /dashboard for student after verification', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    const wrapper = mount(VerifyEmailPage);
    await wrapper.find('[data-testid="otp"]').setValue('123456');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('honors ?redirect param after verification', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    mockQuery.redirect = '/review/create/cuckoo-box';
    const wrapper = mount(VerifyEmailPage);
    await wrapper.find('[data-testid="otp"]').setValue('123456');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/review/create/cuckoo-box');
  });

  it('does not call verifyEmail when code is less than 6 digits', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    const wrapper = mount(VerifyEmailPage);
    await wrapper.find('[data-testid="otp"]').setValue('123');
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it('calls resendVerification when resend button is clicked', async () => {
    mockQuery.email = 'carlos@anahuac.mx';
    const wrapper = mount(VerifyEmailPage);
    const resendBtn = wrapper.findAll('button').find(b => b.text().includes('Reenviar'));
    await resendBtn!.trigger('click');
    await new Promise(r => setTimeout(r, 20));
    expect(mockResendVerification).toHaveBeenCalledWith('carlos@anahuac.mx');
  });
});
