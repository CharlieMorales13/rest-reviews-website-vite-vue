import prisma from '../database/prisma.service';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { injectable } from 'tsyringe';

@injectable()
export class PrismaUserRepository implements IUserRepository {
    async findById(id: string): Promise<User | null> {
        const data = await prisma.user.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByEmail(email: string): Promise<User | null> {
        const data = await prisma.user.findUnique({ where: { email } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findAll(): Promise<User[]> {
        const data = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return data.map(this.mapToDomain);
    }

    async save(user: User): Promise<User> {
        const data = await prisma.user.create({
            data: {
                id: user.id, // Usually undefined on creation so Prisma generates it
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
        return this.mapToDomain(data);
    }

    async update(user: User): Promise<User> {
        if (!user.id) throw new Error('Cannot update user without ID');

        const data = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash,
                role: user.role,
                isActive: user.isActive,
                updatedAt: user.updatedAt,
            },
        });
        return this.mapToDomain(data);
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }

    // Helper method to reconstruct Domain Entity from DB Model
    private mapToDomain(data: any): User {
        return User.create({
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role as UserRole,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
