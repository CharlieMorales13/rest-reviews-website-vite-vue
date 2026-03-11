export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'manager' | 'admin';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface VerifyResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}
