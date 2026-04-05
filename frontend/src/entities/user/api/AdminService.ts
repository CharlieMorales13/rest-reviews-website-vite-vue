import { httpClient } from '@/shared/api/httpClient';

export type UserRole = 'student' | 'manager' | 'admin';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export class AdminService {
    static async listUsers(): Promise<AdminUser[]> {
        const res = await httpClient.get<{ data: AdminUser[]; total: number }>('/api/users');
        return res.data.data;
    }

    static async createUser(payload: CreateUserPayload): Promise<AdminUser> {
        const res = await httpClient.post<{ success: boolean; data: AdminUser }>('/api/users', payload);
        return res.data.data;
    }
}
