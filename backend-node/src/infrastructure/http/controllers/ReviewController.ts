import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateReviewUseCase } from '../../../application/use-cases/reviews/CreateReviewUseCase';
import { CreateReviewSchema } from '../../../application/dtos/ReviewDTO';

@injectable()
export class ReviewController {
    constructor(@inject(CreateReviewUseCase) private createReviewUseCase: CreateReviewUseCase) { }

    public create = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        // We assume the user ID comes from the JWT Auth token (req.user), 
        // but the schema asks for it. We'll merge it with body.
        const payload = {
            ...req.body,
            userId: (req as any).user?.userId || req.body.userId // Fallback to body for now if JWT not fully attached
        };

        const validatedData = CreateReviewSchema.parse(payload);
        const review = await this.createReviewUseCase.execute(validatedData);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                id: review.id,
                establishmentId: review.establishmentId,
                foodScore: review.foodScore,
                serviceScore: review.serviceScore,
                priceScore: review.priceScore,
                createdAt: review.createdAt
            }
        });
    };
}
