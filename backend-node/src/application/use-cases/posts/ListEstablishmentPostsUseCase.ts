import { injectable, inject } from 'tsyringe';
import { IEstablishmentPostRepository } from '../../../domain/repositories/IEstablishmentPostRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { EstablishmentPost } from '../../../domain/entities/EstablishmentPost';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class ListEstablishmentPostsUseCase {
    constructor(
        @inject('IEstablishmentPostRepository') private postRepository: IEstablishmentPostRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository,
    ) { }

    async execute(
        slug: string,
        pagination?: { page: number; limit: number }
    ): Promise<{ data: EstablishmentPost[]; total: number }> {
        const establishment = await this.establishmentRepository.findBySlug(slug);
        if (!establishment) throw new AppError('Establishment not found', 404);

        return this.postRepository.findByEstablishmentId(establishment.id!, pagination);
    }
}
