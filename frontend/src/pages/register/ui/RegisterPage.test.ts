import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import RegisterPage from './RegisterPage.vue';

const mockPush = vi.fn();
const mockRegister = vi.fn();
const mockQuery: Record<string, string> = {};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockQuery }),
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({
    register: mockRegister,
    error: null,
  }),
}));

vi.mock('@/shared/lib/constants', () => ({
  CARRERAS: ['Gastronomía', 'Administración de Empresas', 'Derecho'],
}));

// Helper: fill the form via the non-student path (avoids the custom carrera dropdown)
async function fillFormAsNonStudent(wrapper: ReturnType<typeof mount>) {
  // Switch to non-student mode
  const toggleBtn = wrapper.findAll('button[type="button"]')
    .find(b => b.text().includes('No soy alumno'));
  await toggleBtn!.trigger('click');
  await nextTick();

  // Select "Colaborador" type
  const colaboradorBtn = wrapper.findAll('button[type="button"]')
    .find(b => b.text().includes('Colaborador'));
  await colaboradorBtn!.trigger('click');
  await nextTick();

  // Fill text inputs: name (first), username (second)
  const textInputs = wrapper.findAll('input[type="text"]').filter(i => !i.attributes('disabled'));
  await textInputs[0].setValue('Carlos Test');
  await textInputs[1].setValue('carlos_test');

  await wrapper.find('input[type="email"]').setValue('carlos@anahuac.mx');
  await wrapper.find('input[type="password"]').setValue('password123');
}

describe('RegisterPage — navigation after register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
    Object.keys(mockQuery).forEach(k => delete mockQuery[k]);
  });

  it('navigates to /dashboard after register when no redirect param', async () => {
    const wrapper = mount(RegisterPage);
    await fillFormAsNonStudent(wrapper);
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to redirect param URL after register when param is present', async () => {
    mockQuery.redirect = '/review/create/cuckoo-box';
    const wrapper = mount(RegisterPage);
    await fillFormAsNonStudent(wrapper);
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).toHaveBeenCalledWith('/review/create/cuckoo-box');
  });

  it('does not navigate when register throws', async () => {
    mockRegister.mockRejectedValue(new Error('Email taken'));
    const wrapper = mount(RegisterPage);
    await fillFormAsNonStudent(wrapper);
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not call register when required fields are empty', async () => {
    const wrapper = mount(RegisterPage);
    await wrapper.find('form').trigger('submit');
    await new Promise(r => setTimeout(r, 20));
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
