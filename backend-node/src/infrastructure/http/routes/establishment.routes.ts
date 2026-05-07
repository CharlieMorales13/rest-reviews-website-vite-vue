import { Router } from "express";
import { container } from "../../config/container";
import { EstablishmentController } from "../controllers/EstablishmentController";
import { ReviewController } from "../controllers/ReviewController";
import { EstablishmentPostController } from "../controllers/EstablishmentPostController";
import {
  authenticateToken,
  requireRole,
  optionalAuth,
} from "../middlewares/AuthMiddleware";
import {
  publicReadRateLimiter,
  managerWriteRateLimiter,
} from "../middlewares/RateLimitMiddleware";

const establishmentRouter = Router();
const controller = container.resolve(EstablishmentController);
const reviewController = container.resolve(ReviewController);
const postController = container.resolve(EstablishmentPostController);

// Public Routes
establishmentRouter.get("/", publicReadRateLimiter, controller.getAll);
establishmentRouter.get("/:slug", publicReadRateLimiter, controller.getOne);
establishmentRouter.get(
  "/:slug/reviews",
  publicReadRateLimiter,
  optionalAuth,
  reviewController.getByEstablishment,
);
establishmentRouter.get(
  "/:slug/posts",
  publicReadRateLimiter,
  postController.list,
);

// Protected Routes
establishmentRouter.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  managerWriteRateLimiter,
  controller.create,
);
establishmentRouter.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "manager"]),
  managerWriteRateLimiter,
  controller.update,
);
establishmentRouter.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  managerWriteRateLimiter,
  controller.delete,
);
establishmentRouter.post(
  "/:slug/posts",
  authenticateToken,
  requireRole(["admin", "manager"]),
  managerWriteRateLimiter,
  postController.create,
);
establishmentRouter.put(
  "/:slug/posts/:postId",
  authenticateToken,
  requireRole(["admin", "manager"]),
  managerWriteRateLimiter,
  postController.update,
);
establishmentRouter.delete(
  "/:slug/posts/:postId",
  authenticateToken,
  requireRole(["admin", "manager"]),
  managerWriteRateLimiter,
  postController.delete,
);

export default establishmentRouter;
