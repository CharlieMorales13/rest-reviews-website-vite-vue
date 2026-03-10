import { z } from 'zod';

export const CreateReviewSchema = z.object({
    userId: z.string().uuid('Invalid User ID format'),
    establishmentId: z.string().uuid('Invalid Establishment ID format'),
    foodScore: z.number().int().min(1).max(5),
    serviceScore: z.number().int().min(1).max(5),
    priceScore: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Comment must be at least 10 characters long'),
    imageUrl: z.string().url('Invalid Image URL format').optional().or(z.literal('')),
});

export type CreateReviewDTO = z.infer<typeof CreateReviewSchema>;
