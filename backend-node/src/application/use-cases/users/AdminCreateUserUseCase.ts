import { injectable, inject } from 'tsyringe';
import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { AdminCreateUserDTO } from '../../dtos/UserDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import * as argon2 from 'argon2';

export interface AdminCreateUserResult {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date | undefined;
    establishmentId?: string | null;
    establishmentName?: string | null;
}

@injectable()
export class AdminCreateUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository,
    ) { }

    async execute(dto: AdminCreateUserDTO): Promise<AdminCreateUserResult> {
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing) {
            throw new AppError('Ya existe una cuenta con ese correo electrónico', 409);
        }

        const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

        const user = User.create({
            name: dto.name,
            email: dto.email,
            passwordHash,
            role: dto.role as UserRole,
            isVerified: true,
            isActive: true,
        });

        const saved = await this.userRepository.save(user);

        if (!saved.id) {
            throw new AppError('Error al crear el usuario', 500);
        }

        let establishmentId: string | null = null;
        let establishmentName: string | null = null;

        if (dto.role === UserRole.MANAGER && dto.establishmentId) {
            const establishment = await this.establishmentRepository.findById(dto.establishmentId);
            if (!establishment) {
                throw new AppError('Establecimiento no encontrado', 404);
            }
            establishment.assignManager(saved.id);
            const updated = await this.establishmentRepository.update(establishment);
            establishmentId = updated.id ?? null;
            establishmentName = updated.name;
        }

        return {
            id: saved.id,
            name: saved.name,
            email: saved.email,
            role: saved.role,
            isActive: saved.isActive ?? true,
            createdAt: saved.createdAt,
            establishmentId,
            establishmentName,
        };
    }
}
