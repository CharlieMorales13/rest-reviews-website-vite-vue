import { Router } from "express";
import { container } from "../../config/container";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middlewares/AuthMiddleware";
import { authenticatedReadRateLimiter } from "../middlewares/RateLimitMiddleware";

const notificationRouter = Router();
const notificationController = container.resolve(NotificationController);

notificationRouter.get(
  "/",
  authenticateToken,
  authenticatedReadRateLimiter,
  notificationController.getAll,
);
notificationRouter.patch(
  "/:id/read",
  authenticateToken,
  authenticatedReadRateLimiter,
  notificationController.markAsRead,
);

export default notificationRouter;
