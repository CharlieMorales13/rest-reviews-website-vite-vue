import { injectable, inject } from "tsyringe";
import { Review } from "../../../domain/entities/Review";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";

@injectable()
export class ListReviewsUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
  ) {}

  async execute(pagination?: {
    page: number;
    limit: number;
  }): Promise<{ data: Review[]; total: number }> {
    return await this.reviewRepository.findAll(pagination);
  }
}
