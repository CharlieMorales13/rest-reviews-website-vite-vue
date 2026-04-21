import { injectable, inject } from "tsyringe";
import { IEstablishmentPostRepository } from "../../../domain/repositories/IEstablishmentPostRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { EstablishmentPost } from "../../../domain/entities/EstablishmentPost";
import { UpdateEstablishmentPostDTO } from "../../dtos/EstablishmentPostDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class UpdateEstablishmentPostUseCase {
  constructor(
    @inject("IEstablishmentPostRepository")
    private postRepository: IEstablishmentPostRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
  ) {}

  async execute(
    postId: string,
    dto: UpdateEstablishmentPostDTO,
    requester: { id: string; role: string },
  ): Promise<EstablishmentPost> {
    const existing = await this.postRepository.findById(postId);
    if (!existing) throw new AppError("Post not found", 404);

    const establishment = await this.establishmentRepository.findById(
      existing.establishmentId,
    );
    if (!establishment) throw new AppError("Establishment not found", 404);

    if (
      requester.role !== "admin" &&
      establishment.managerId !== requester.id
    ) {
      throw new AppError("You do not have permission to edit this post", 403);
    }

    const updated = EstablishmentPost.create({
      id: existing.id,
      establishmentId: existing.establishmentId,
      authorId: existing.authorId,
      content: dto.content ?? existing.content,
      imageUrls:
        dto.imageUrls !== undefined ? dto.imageUrls : existing.imageUrls,
      isPublished: existing.isPublished,
      createdAt: existing.createdAt,
    });

    return this.postRepository.update(updated);
  }
}
