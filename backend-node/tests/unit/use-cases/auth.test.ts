import { describe, it, expect } from 'vitest';
import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
} from '@/application/dtos/AuthDTO';

describe('RegisterUserSchema', () => {
  const validInput = {
    name: 'Carlos Gomez',
    username: 'carlos_gomez',
    email: 'carlos@anahuac.mx',
    password: 'secure123',
    carrera: 'Ingenieria en Software',
  };

  it('accepts valid input', () => {
    const result = RegisterUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name, ...rest } = validInput;
    const result = RegisterUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const { email, ...rest } = validInput;
    const result = RegisterUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const { password, ...rest } = validInput;
    const result = RegisterUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing carrera', () => {
    const { carrera, ...rest } = validInput;
    const result = RegisterUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('accepts name with exactly 2 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, name: 'Al' });
    expect(result.success).toBe(true);
  });

  it('rejects name longer than 120 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, name: 'A'.repeat(121) });
    expect(result.success).toBe(false);
  });

  it('accepts name with exactly 120 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, name: 'A'.repeat(120) });
    expect(result.success).toBe(true);
  });

  it('rejects malformed email', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('rejects password shorter than 6 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, password: '12345' });
    expect(result.success).toBe(false);
  });

  it('accepts password with exactly 6 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects empty carrera', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, carrera: '' });
    expect(result.success).toBe(false);
  });

  it('rejects carrera longer than 100 characters', () => {
    const result = RegisterUserSchema.safeParse({ ...validInput, carrera: 'X'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('LoginUserSchema', () => {
  const validInput = {
    email: 'carlos@anahuac.mx',
    password: 'secure123',
  };

  it('accepts valid input', () => {
    const result = LoginUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = LoginUserSchema.safeParse({ password: 'secure123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = LoginUserSchema.safeParse({ email: 'carlos@anahuac.mx' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed email', () => {
    const result = LoginUserSchema.safeParse({ ...validInput, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = LoginUserSchema.safeParse({ ...validInput, password: '' });
    expect(result.success).toBe(false);
  });

  it('accepts single-character password', () => {
    const result = LoginUserSchema.safeParse({ ...validInput, password: 'x' });
    expect(result.success).toBe(true);
  });
});

describe('ChangePasswordSchema', () => {
  const validInput = {
    currentPassword: 'oldpass',
    newPassword: 'newpass123',
  };

  it('accepts valid input', () => {
    const result = ChangePasswordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing currentPassword', () => {
    const result = ChangePasswordSchema.safeParse({ newPassword: 'newpass123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing newPassword', () => {
    const result = ChangePasswordSchema.safeParse({ currentPassword: 'oldpass' });
    expect(result.success).toBe(false);
  });

  it('rejects empty currentPassword', () => {
    const result = ChangePasswordSchema.safeParse({ ...validInput, currentPassword: '' });
    expect(result.success).toBe(false);
  });

  it('rejects newPassword shorter than 6 characters', () => {
    const result = ChangePasswordSchema.safeParse({ ...validInput, newPassword: '12345' });
    expect(result.success).toBe(false);
  });

  it('accepts newPassword with exactly 6 characters', () => {
    const result = ChangePasswordSchema.safeParse({ ...validInput, newPassword: '123456' });
    expect(result.success).toBe(true);
  });
});
