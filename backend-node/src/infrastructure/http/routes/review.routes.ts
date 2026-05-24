import { Router } from "express";
import { container } from "../../config/container";
import { ReviewController } from "../controllers/ReviewController";
import { authenticateToken, requireRole } from "../middlewares/AuthMiddleware";
import {
  reviewRateLimiter,
  reviewMutationRateLimiter,
  likeRateLimiter,
  replyRateLimiter,
  publicReadRateLimiter,
  authenticatedReadRateLimiter,
} from "../middlewares/RateLimitMiddleware";

const reviewRouter = Router();

// Resolve Controller with all its dependencies automatically
const reviewController = container.resolve(ReviewController);

// Routes
reviewRouter.get("/", publicReadRateLimiter, reviewController.getAll);
reviewRouter.get("/my", authenticateToken, authenticatedReadRateLimiter, reviewController.getMyReviews);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags:
 *       - Reviews
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
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Invalid input
 */
reviewRouter.post(
  "/",
  authenticateToken,
  requireRole(["student"]),
  reviewRateLimiter,
  reviewController.create,
);
reviewRouter.patch(
  "/:id",
  authenticateToken,
  requireRole(["student"]),
  reviewMutationRateLimiter,
  reviewController.updateUserReview,
);
reviewRouter.delete(
  "/:id",
  authenticateToken,
  requireRole(["student"]),
  reviewMutationRateLimiter,
  reviewController.deleteUserReview,
);
reviewRouter.patch(
  "/:id/reply",
  authenticateToken,
  requireRole(["admin", "manager"]),
  replyRateLimiter,
  reviewController.reply,
);
reviewRouter.post(
  "/:id/like",
  authenticateToken,
  requireRole(["student"]),
  likeRateLimiter,
  reviewController.likeReview,
);
reviewRouter.delete(
  "/:id/like",
  authenticateToken,
  requireRole(["student"]),
  likeRateLimiter,
  reviewController.unlikeReview,
);

export default reviewRouter;
