import { Router } from "express";
import { container } from "../../config/container";
import { UserController } from "../controllers/UserController";
import { authenticateToken, requireRole } from "../middlewares/AuthMiddleware";
import {
  authenticatedReadRateLimiter,
  managerWriteRateLimiter,
} from "../middlewares/RateLimitMiddleware";

const userRouter = Router();
const controller = container.resolve(UserController);

// All user management routes are protected
userRouter.use(authenticateToken);

userRouter.get(
  "/:id/profile",
  authenticatedReadRateLimiter,
  controller.getProfile,
);

// Admin-only routes
userRouter.post(
  "/",
  requireRole(["admin"]),
  managerWriteRateLimiter,
  controller.create,
);
userRouter.get(
  "/",
  requireRole(["admin"]),
  authenticatedReadRateLimiter,
  controller.getAll,
);
userRouter.get(
  "/:id",
  requireRole(["admin"]),
  authenticatedReadRateLimiter,
  controller.getById,
);
userRouter.put(
  "/:id",
  requireRole(["admin"]),
  managerWriteRateLimiter,
  controller.update,
);
userRouter.delete(
  "/:id",
  requireRole(["admin"]),
  managerWriteRateLimiter,
  controller.delete,
);

export default userRouter;
