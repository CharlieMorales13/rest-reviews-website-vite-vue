import { injectable, inject } from "tsyringe";
import { Review } from "../../../domain/entities/Review";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class ListEstablishmentReviewsUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
  ) {}

  async execute(
    slug: string,
    pagination?: { page: number; limit: number },
  ): Promise<{ data: Review[]; total: number }> {
    // 1. Resolve slug to establishment
    const establishment = await this.establishmentRepository.findBySlug(slug);
    if (!establishment) {
      throw new AppError("Establishment not found", 404);
    }

    // 2. Fetch reviews
    return await this.reviewRepository.findByEstablishmentId(
      establishment.id!,
      pagination,
    );
  }
}
