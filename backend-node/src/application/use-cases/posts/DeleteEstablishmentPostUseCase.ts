import { injectable, inject } from "tsyringe";
import { IEstablishmentPostRepository } from "../../../domain/repositories/IEstablishmentPostRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class DeleteEstablishmentPostUseCase {
  constructor(
    @inject("IEstablishmentPostRepository")
    private postRepository: IEstablishmentPostRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
  ) {}

  async execute(
    postId: string,
    requester: { id: string; role: string },
  ): Promise<void> {
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
      throw new AppError("You do not have permission to delete this post", 403);
    }

    await this.postRepository.delete(postId);
  }
}
