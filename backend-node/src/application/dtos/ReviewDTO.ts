import { z } from 'zod';

export const CreateReviewSchema = z.object({
    userId: z.string().uuid('Invalid User ID format'),
    establishmentId: z.string().uuid('Invalid Establishment ID format'),
    foodScore: z.number().int().min(1).max(5),
    serviceScore: z.number().int().min(1).max(5),
    priceScore: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Comment must be at least 10 characters long').optional(),
    imageUrl: z.string().url('Invalid Image URL format').optional().or(z.literal('')),
});

export type CreateReviewDTO = z.infer<typeof CreateReviewSchema>;

export const ReplyReviewSchema = z.object({
    reviewId: z.string().uuid('Invalid Review ID format'),
    managerId: z.string().uuid('Invalid Manager ID format'),
    reply: z.string().min(5, 'Reply must be at least 5 characters long'),
});

export type ReplyReviewDTO = z.infer<typeof ReplyReviewSchema>;
