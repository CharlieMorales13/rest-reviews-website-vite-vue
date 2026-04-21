import { z } from "zod";
import { UserRole } from "../../domain/entities/User";

export const AdminCreateUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(UserRole),
  establishmentId: z.string().uuid().optional(),
});

export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  universityId: z.string().optional().nullable(),
  carrera: z.string().max(100).optional().nullable(),
  establishmentId: z.string().uuid().optional().nullable(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

// Safe subset for self-service profile updates — never allows role/isActive/establishmentId
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  universityId: z.string().optional().nullable(),
  carrera: z.string().max(100).optional().nullable(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

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
