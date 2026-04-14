import { z } from 'zod';

export const CreateEstablishmentSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150),
    description: z.string().max(500).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    universityId: z.string().max(100).optional().nullable(),
    locationDetails: z.string().optional().nullable(),
    openingHours: z.string().optional().nullable(),
    galleryUrls: z.array(z.string().url()).optional(),
    menuUrls: z.array(z.string().url()).optional(),
    logoUrl: z.string().url().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
});

export const UpdateEstablishmentSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    description: z.string().max(500).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    universityId: z.string().max(100).optional().nullable(),
    locationDetails: z.string().optional().nullable(),
    openingHours: z.string().optional().nullable(),
    galleryUrls: z.array(z.string().url()).optional(),
    menuUrls: z.array(z.string().url()).optional(),
    logoUrl: z.string().url().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
});

export type CreateEstablishmentDTO = z.infer<typeof CreateEstablishmentSchema>;
export type UpdateEstablishmentDTO = z.infer<typeof UpdateEstablishmentSchema>;
