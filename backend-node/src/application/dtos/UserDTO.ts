import { z } from 'zod';
import { UserRole } from '../../domain/entities/User';

export const UpdateUserSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    bio: z.string().max(500).optional().nullable(),
    universityId: z.string().optional().nullable(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

export const UserResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;
