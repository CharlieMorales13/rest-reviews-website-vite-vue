import { z } from 'zod';

export const CreateEstablishmentPostSchema = z.object({
    content: z.string().min(1, 'Content is required').max(2000),
    imageUrls: z.array(z.string().url()).max(4).optional().default([]),
});

export const UpdateEstablishmentPostSchema = z.object({
    content: z.string().min(1).max(2000).optional(),
    imageUrls: z.array(z.string().url()).max(4).optional(),
});

export type CreateEstablishmentPostDTO = z.infer<typeof CreateEstablishmentPostSchema>;
export type UpdateEstablishmentPostDTO = z.infer<typeof UpdateEstablishmentPostSchema>;
