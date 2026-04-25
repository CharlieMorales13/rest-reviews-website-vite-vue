import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReviewCard from './ReviewCard.vue';
import { ReviewService } from '@/entities/review/api/ReviewService';

vi.mock('@/entities/review/api/ReviewService', () => ({
  ReviewService: {
    likeReview: vi.fn(),
    unlikeReview: vi.fn(),
  },
}));

vi.mock('@/entities/user/model/authStore', () => ({
  useAuthStore: () => ({ userRole: 'student' }),
}));

const baseReview = {
  id: 'r1',
  foodScore: 4,
  serviceScore: 4,
  priceScore: 4,
  createdAt: new Date().toISOString(),
  likesCount: 3,
  likedByMe: false,
};

describe('ReviewCard — likes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el botón de like para rol student con showLike=true', () => {
    const wrapper = mount(ReviewCard, { props: { review: baseReview, showLike: true } });
    expect(wrapper.find('[data-testid="like-btn"]').exists()).toBe(true);
  });

  it('no muestra el botón de like si showLike=false', () => {
    const wrapper = mount(ReviewCard, { props: { review: baseReview, showLike: false } });
    expect(wrapper.find('[data-testid="like-btn"]').exists()).toBe(false);
  });

  it('actualiza el contador optimistamente al hacer click en like', async () => {
    vi.mocked(ReviewService.likeReview).mockResolvedValue({ likesCount: 4, likedByMe: true });
    const wrapper = mount(ReviewCard, { props: { review: baseReview, showLike: true } });
    await wrapper.find('[data-testid="like-btn"]').trigger('click');
    expect(wrapper.find('[data-testid="like-count"]').text()).toBe('4');
  });

  it('revierte el contador si el API falla', async () => {
    vi.mocked(ReviewService.likeReview).mockRejectedValue(new Error('fail'));
    const wrapper = mount(ReviewCard, { props: { review: baseReview, showLike: true } });
    await wrapper.find('[data-testid="like-btn"]').trigger('click');
    await new Promise((r) => setTimeout(r, 50));
    expect(wrapper.find('[data-testid="like-count"]').text()).toBe('3');
  });
});
