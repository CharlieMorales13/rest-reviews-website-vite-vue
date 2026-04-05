import { httpClient } from '@/shared/api/httpClient';

export type UserRole = 'student' | 'manager' | 'admin';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    establishment?: { id: string; name: string } | null;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    establishmentId?: string;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    establishmentId?: string | null;
}

export interface AdminEstablishment {
    id: string;
    name: string;
    category?: string | null;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class AdminService {
    static async listUsers(page = 1, limit = 10): Promise<{ data: AdminUser[]; meta: PaginationMeta }> {
        const res = await httpClient.get<{ data: AdminUser[]; meta: PaginationMeta }>(`/api/users?page=${page}&limit=${limit}`);
        return res.data;
    }

    static async createUser(payload: CreateUserPayload): Promise<AdminUser> {
        const res = await httpClient.post<{ success: boolean; data: AdminUser }>('/api/users', payload);
        return res.data.data;
    }

    static async updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
        const res = await httpClient.put<{ success: boolean; data: AdminUser }>(`/api/users/${id}`, payload);
        return res.data.data;
    }

    static async deleteUser(id: string): Promise<void> {
        await httpClient.delete(`/api/users/${id}`);
    }

    static async listEstablishments(): Promise<AdminEstablishment[]> {
        const res = await httpClient.get<{ success: boolean; data: AdminEstablishment[] }>('/api/establishments');
        return res.data.data;
    }
}
