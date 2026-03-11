import { z } from 'zod';

export const RegisterUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginUserDTO = z.infer<typeof LoginUserSchema>;
