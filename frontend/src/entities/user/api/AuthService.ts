import { httpClient } from '@/shared/api/httpClient';
import type { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, VerifyRequest, VerifyResponse } from '../model/types';

export interface UpdateProfileRequest {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  universityId?: string | null;
  carrera?: string | null;
}

export class AuthService {
  static async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/api/auth/login', request);
    return response.data;
  }

  static async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await httpClient.post<RegisterResponse>('/api/auth/register', request);
    return response.data;
  }

  static async verifyEmail(request: VerifyRequest): Promise<VerifyResponse> {
    const response = await httpClient.post<VerifyResponse>('/api/auth/verify', request);
    return response.data;
  }

  static async getMe(): Promise<User> {
    const response = await httpClient.get<{ success: boolean; data: User }>('/api/auth/me');
    return response.data.data;
  }

  static async updateMe(payload: UpdateProfileRequest): Promise<User> {
    const response = await httpClient.patch<{ success: boolean; data: User }>('/api/auth/me', payload);
    return response.data.data;
  }
}
