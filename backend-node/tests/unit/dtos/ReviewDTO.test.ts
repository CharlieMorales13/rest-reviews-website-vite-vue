import { describe, it, expect } from 'vitest';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReplyReviewSchema,
} from '@/application/dtos/ReviewDTO';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('CreateReviewSchema', () => {
  const validInput = {
    userId: validUUID,
    establishmentId: validUUID,
    foodScore: 4,
    serviceScore: 3,
    priceScore: 5,
  };

  it('accepts valid input with required fields only', () => {
    const result = CreateReviewSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with all optional fields', () => {
    const result = CreateReviewSchema.safeParse({
      ...validInput,
      title: 'Great food',
      comment: 'Really enjoyed the tacos here',
      imageUrl: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid userId UUID', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, userId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('userId');
    }
  });

  it('rejects invalid establishmentId UUID', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, establishmentId: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects foodScore of 0 (below minimum)', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, foodScore: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects foodScore of 6 (above maximum)', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, foodScore: 6 });
    expect(result.success).toBe(false);
  });

  it('accepts foodScore at boundaries (1 and 5)', () => {
    expect(CreateReviewSchema.safeParse({ ...validInput, foodScore: 1 }).success).toBe(true);
    expect(CreateReviewSchema.safeParse({ ...validInput, foodScore: 5 }).success).toBe(true);
  });

  it('rejects non-integer score', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, serviceScore: 3.5 });
    expect(result.success).toBe(false);
  });

  it('rejects serviceScore of 0', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, serviceScore: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects priceScore of 6', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, priceScore: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects comment shorter than 10 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, comment: 'Too short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('comment');
    }
  });

  it('accepts comment with exactly 10 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, comment: 'Exactly 10' });
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 5 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, title: 'Hey!' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 100 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, title: 'T'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid imageUrl', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, imageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts valid imageUrl', () => {
    const result = CreateReviewSchema.safeParse({
      ...validInput,
      imageUrl: 'https://cdn.example.com/img.png',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for imageUrl', () => {
    const result = CreateReviewSchema.safeParse({ ...validInput, imageUrl: '' });
    expect(result.success).toBe(true);
  });

  it('sanitizes HTML tags in title and comment to prevent Stored XSS', () => {
    const result = CreateReviewSchema.safeParse({
      ...validInput,
      title: '<b>Awesome Tacos</b>',
      comment: '<script>alert("hack")</script>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('&lt;b&gt;Awesome Tacos&lt;&#x2F;b&gt;');
      expect(result.data.comment).toBe('&lt;script&gt;alert(&quot;hack&quot;)&lt;&#x2F;script&gt;');
    }
  });
});

describe('UpdateReviewSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = UpdateReviewSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid partial update', () => {
    const result = UpdateReviewSchema.safeParse({ foodScore: 5, comment: 'Updated my review text' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid score value', () => {
    const result = UpdateReviewSchema.safeParse({ foodScore: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects score above maximum', () => {
    const result = UpdateReviewSchema.safeParse({ priceScore: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer score', () => {
    const result = UpdateReviewSchema.safeParse({ serviceScore: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects comment shorter than 10 characters', () => {
    const result = UpdateReviewSchema.safeParse({ comment: 'Short' });
    expect(result.success).toBe(false);
  });
});

describe('ReplyReviewSchema', () => {
  const validReply = {
    reviewId: validUUID,
    managerId: validUUID,
    reply: 'Thank you for your feedback!',
  };

  it('accepts valid input', () => {
    const result = ReplyReviewSchema.safeParse(validReply);
    expect(result.success).toBe(true);
  });

  it('rejects invalid reviewId UUID', () => {
    const result = ReplyReviewSchema.safeParse({ ...validReply, reviewId: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid managerId UUID', () => {
    const result = ReplyReviewSchema.safeParse({ ...validReply, managerId: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects reply shorter than 5 characters', () => {
    const result = ReplyReviewSchema.safeParse({ ...validReply, reply: 'Hi!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('reply');
    }
  });

  it('accepts reply with exactly 5 characters', () => {
    const result = ReplyReviewSchema.safeParse({ ...validReply, reply: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('rejects missing reply field', () => {
    const { reply, ...rest } = validReply;
    const result = ReplyReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('sanitizes HTML tags in reply to prevent Stored XSS', () => {
    const result = ReplyReviewSchema.safeParse({
      ...validReply,
      reply: '<u>Response containing HTML</u>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reply).toBe('&lt;u&gt;Response containing HTML&lt;&#x2F;u&gt;');
    }
  });
});
