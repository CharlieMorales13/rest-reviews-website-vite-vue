import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateReviewUseCase } from '../../../application/use-cases/reviews/CreateReviewUseCase';
import { ListEstablishmentReviewsUseCase } from '../../../application/use-cases/reviews/ListEstablishmentReviewsUseCase';
import { ListReviewsUseCase } from '../../../application/use-cases/reviews/ListReviewsUseCase';
import { ListUserReviewsUseCase } from '../../../application/use-cases/reviews/ListUserReviewsUseCase';
import { ReplyToReviewUseCase } from '../../../application/use-cases/reviews/ReplyToReviewUseCase';
import { CreateReviewSchema, ReplyReviewSchema } from '../../../application/dtos/ReviewDTO';
import { AuthRequest } from '../middlewares/AuthMiddleware';

import { createPaginatedResponse } from '../utils/Pagination';

@injectable()
export class ReviewController {
    constructor(
        @inject(CreateReviewUseCase) private createReviewUseCase: CreateReviewUseCase,
        @inject(ListEstablishmentReviewsUseCase) private listEstablishmentReviewsUseCase: ListEstablishmentReviewsUseCase,
        @inject(ListReviewsUseCase) private listReviewsUseCase: ListReviewsUseCase,
        @inject(ListUserReviewsUseCase) private listUserReviewsUseCase: ListUserReviewsUseCase,
        @inject(ReplyToReviewUseCase) private replyToReviewUseCase: ReplyToReviewUseCase
    ) { }

    /**
     * @swagger
     * /reviews:
     *   get:
     *     summary: List all reviews with pagination
     *     tags: [Reviews]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Results per page
     *     responses:
     *       200:
     *         description: Paginated list of reviews
     */
    public getAll = async (req: Request, res: Response): Promise<void> => {
        const { page, limit } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        const { data, total } = await this.listReviewsUseCase.execute({ page: pageNum, limit: limitNum });

        const formatted = data.map(r => ({
            id: r.id,
            author: r.authorName,
            establishmentId: r.establishmentId,
            comment: r.comment,
            foodScore: r.foodScore,
            serviceScore: r.serviceScore,
            priceScore: r.priceScore,
            imageUrl: r.imageUrl,
            sentiment: r.sentiment,
            createdAt: r.createdAt
        }));

        res.status(200).json(
            createPaginatedResponse(formatted, total, pageNum, limitNum)
        );
    };

    /**
     * @swagger
     * /establishments/{id}/reviews:
     *   get:
     *     summary: Get all reviews for a specific establishment with pagination
     *     tags: [Reviews]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: OK
     */
    public getByEstablishment = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { page, limit } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        const { data, total } = await this.listEstablishmentReviewsUseCase.execute(id as string, { page: pageNum, limit: limitNum });

        const formatted = data.map(r => ({
            id: r.id,
            author: r.authorName,
            comment: r.comment,
            foodScore: r.foodScore,
            serviceScore: r.serviceScore,
            priceScore: r.priceScore,
            imageUrl: r.imageUrl,
            sentiment: r.sentiment,
            managerReply: r.managerReply ?? null,
            managerReplyAt: r.managerReplyAt ?? null,
            createdAt: r.createdAt,
        }));

        res.status(200).json(
            createPaginatedResponse(formatted, total, pageNum, limitNum)
        );
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

    /**
     * @swagger
     * /reviews/{id}/reply:
     *   patch:
     *     summary: Reply to a review (for managers and admins)
     *     tags: [Reviews]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               reply:
     *                 type: string
     *     responses:
     *       200:
     *         description: OK
     */
    public getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const reviews = await this.listUserReviewsUseCase.execute(userId);
        const formatted = reviews.map(r => ({
            id: r.id,
            establishmentId: r.establishmentId,
            establishmentName: r.establishmentName ?? null,
            comment: r.comment ?? null,
            foodScore: r.foodScore,
            serviceScore: r.serviceScore,
            priceScore: r.priceScore,
            imageUrl: r.imageUrl ?? null,
            sentiment: r.sentiment ?? null,
            managerReply: r.managerReply ?? null,
            managerReplyAt: r.managerReplyAt ?? null,
            createdAt: r.createdAt,
        }));
        res.status(200).json({ success: true, data: formatted });
    };

    public reply = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const user = (req as any).user;
        const payload = {
            reviewId: id,
            managerId: user.userId,
            reply: req.body.reply
        };

        const validatedData = ReplyReviewSchema.parse(payload);
        const review = await this.replyToReviewUseCase.execute(validatedData, user.role);

        res.status(200).json({
            success: true,
            message: 'Manager reply added successfully',
            data: {
                id: review.id,
                managerReply: review.managerReply,
                managerReplyAt: review.managerReplyAt
            }
        });
    };
}
