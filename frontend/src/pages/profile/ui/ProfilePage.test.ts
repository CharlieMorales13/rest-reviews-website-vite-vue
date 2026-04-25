import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/entities/review/api/ReviewService', () => ({
  ReviewService: { getMyReviews: vi.fn() },
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({
    user: { name: 'Test User', avatarUrl: null, bio: null, carrera: 'Gastronomía' },
    userRole: 'student',
    fetchProfile: vi.fn(),
  }),
}));

// Mock de componentes hijos para evitar errores de setup
vi.mock('./EditProfileModal.vue', () => ({ default: { template: '<div />' } }));
vi.mock('./ChangePasswordModal.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/shared/ui/ReviewCard.vue', () => ({
  default: { template: '<div data-testid="review-card"><slot /></div>' }
}));

import { ReviewService } from '@/entities/review/api/ReviewService';
import ProfilePage from './ProfilePage.vue';

const makeReviews = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `r${i}`,
    establishmentId: i % 2 === 0 ? 'est-1' : 'est-2',
    establishmentName: i % 2 === 0 ? 'DelyFull' : 'Guajaquenito',
    foodScore: (i % 5) + 1,
    serviceScore: 4,
    priceScore: 3,
    createdAt: new Date(2026, 0, i + 1).toISOString(),
    likesCount: i,
    comment: `Review ${i}`,
  }));

describe('ProfilePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('muestra máximo 5 reseñas', async () => {
    vi.mocked(ReviewService.getMyReviews).mockResolvedValue(makeReviews(8) as any);
    const wrapper = mount(ProfilePage);
    await new Promise((r) => setTimeout(r, 30));
    expect(wrapper.findAll('[data-testid="review-card"]').length).toBeLessThanOrEqual(5);
  });

  it('calcula el total de likes como suma de likesCount', async () => {
    const reviews = makeReviews(3); // likesCount: 0+1+2 = 3
    vi.mocked(ReviewService.getMyReviews).mockResolvedValue(reviews as any);
    const wrapper = mount(ProfilePage);
    await new Promise((r) => setTimeout(r, 30));
    expect(wrapper.find('[data-testid="total-likes"]').text()).toBe('3');
  });

  it('filtra reseñas por establecimiento', async () => {
    vi.mocked(ReviewService.getMyReviews).mockResolvedValue(makeReviews(6) as any);
    const wrapper = mount(ProfilePage);
    await new Promise((r) => setTimeout(r, 30));
    const select = wrapper.find('[data-testid="filter-establishment"]');
    await select.setValue('DelyFull');
    await wrapper.vm.$nextTick();
    const cards = wrapper.findAll('[data-testid="review-card"]');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3); // solo DelyFull (índices pares de 6 = 3)
  });
});
