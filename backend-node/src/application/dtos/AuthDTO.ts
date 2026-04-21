import { z } from "zod";

export const RegisterUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  carrera: z.string().min(1, "La carrera es requerida").max(100),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUserDTO = z.infer<typeof LoginUserSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
