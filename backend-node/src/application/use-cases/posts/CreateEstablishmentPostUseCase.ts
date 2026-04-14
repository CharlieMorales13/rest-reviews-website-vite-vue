import { injectable, inject } from 'tsyringe';
import { IEstablishmentPostRepository } from '../../../domain/repositories/IEstablishmentPostRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { EstablishmentPost } from '../../../domain/entities/EstablishmentPost';
import { CreateEstablishmentPostDTO } from '../../dtos/EstablishmentPostDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class CreateEstablishmentPostUseCase {
    constructor(
        @inject('IEstablishmentPostRepository') private postRepository: IEstablishmentPostRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository,
    ) { }

    async execute(
        slug: string,
        dto: CreateEstablishmentPostDTO,
        requester: { id: string; role: string }
    ): Promise<EstablishmentPost> {
        const establishment = await this.establishmentRepository.findBySlug(slug);
        if (!establishment) throw new AppError('Establishment not found', 404);

        if (requester.role !== 'admin' && establishment.managerId !== requester.id) {
            throw new AppError('You do not have permission to post for this establishment', 403);
        }

        const post = EstablishmentPost.create({
            establishmentId: establishment.id!,
            authorId: requester.id,
            content: dto.content,
            imageUrls: dto.imageUrls ?? [],
        });

        return this.postRepository.save(post);
    }
}
