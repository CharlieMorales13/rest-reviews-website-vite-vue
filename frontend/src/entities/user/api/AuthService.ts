import { httpClient } from '@/shared/api/httpClient';
import type { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, VerifyRequest, VerifyResponse } from '../model/types';

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
}
