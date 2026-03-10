import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateReviewUseCase } from '../../../application/use-cases/reviews/CreateReviewUseCase';
import { ListEstablishmentReviewsUseCase } from '../../../application/use-cases/reviews/ListEstablishmentReviewsUseCase';
import { CreateReviewSchema } from '../../../application/dtos/ReviewDTO';

@injectable()
export class ReviewController {
    constructor(
        @inject(CreateReviewUseCase) private createReviewUseCase: CreateReviewUseCase,
        @inject(ListEstablishmentReviewsUseCase) private listReviewsUseCase: ListEstablishmentReviewsUseCase
    ) { }

    /**
     * @swagger
     * /establishments/{id}/reviews:
     *   get:
     *     summary: Get all reviews for a specific establishment
     *     tags: [Reviews]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: OK
     */
    public getByEstablishment = async (req: Request, res: Response): Promise<void> => {
        const establishmentId = req.params.id as string;
        const reviews = await this.listReviewsUseCase.execute(establishmentId);

        res.status(200).json({
            success: true,
            data: reviews.map(r => ({
                id: r.id,
                author: r.authorName,
                comment: r.comment,
                foodScore: r.foodScore,
                serviceScore: r.serviceScore,
                priceScore: r.priceScore,
                imageUrl: r.imageUrl,
                sentiment: r.sentiment,
                createdAt: r.createdAt
            }))
        });
    };

    /**
     * @swagger
     * /reviews:
     *   post:
     *     summary: Create a new review
     *     tags: [Reviews]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateReviewInput'
     *     responses:
     *       201:
     *         description: Created
     */
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
                imageUrl: review.imageUrl,
                createdAt: review.createdAt
            }
        });
    };
}
