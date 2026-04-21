import { injectable, inject } from "tsyringe";
import { Review } from "../../../domain/entities/Review";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { CreateNotificationUseCase } from "../notifications/CreateNotificationUseCase";
import { ReplyReviewDTO } from "../../dtos/ReviewDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class ReplyToReviewUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
    @inject(CreateNotificationUseCase)
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(dto: ReplyReviewDTO, userRole: string): Promise<Review> {
    const review = await this.reviewRepository.findById(dto.reviewId);
    if (!review) throw new AppError("Review not found", 404);

    const establishment = await this.establishmentRepository.findById(
      review.establishmentId,
    );
    if (!establishment) throw new AppError("Establishment not found", 404);

    if (
      userRole !== "admin" &&
      establishment.managerId?.toString() !== dto.managerId
    ) {
      throw new AppError(
        "You are not authorized to reply to reviews for this establishment",
        403,
      );
    }

    review.addManagerReply(dto.reply);
    const updated = await this.reviewRepository.update(review);

    // Fire-and-forget: notify the review author
    this.createNotificationUseCase
      .execute({ userId: review.userId, reviewId: review.id! })
      .catch(() => {});

    return updated;
  }
}
