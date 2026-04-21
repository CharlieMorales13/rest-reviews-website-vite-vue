import { Router } from "express";
import { container } from "../../config/container";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middlewares/AuthMiddleware";

const notificationRouter = Router();
const notificationController = container.resolve(NotificationController);

notificationRouter.get("/", authenticateToken, notificationController.getAll);
notificationRouter.patch(
  "/:id/read",
  authenticateToken,
  notificationController.markAsRead,
);

export default notificationRouter;
