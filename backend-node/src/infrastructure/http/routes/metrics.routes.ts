import { Router } from "express";
import { container } from "../../config/container";
import { MetricsController } from "../controllers/MetricsController";
import { authenticateToken, requireRole } from "../middlewares/AuthMiddleware";
import {
  pipelineRateLimiter,
  authenticatedReadRateLimiter,
} from "../middlewares/RateLimitMiddleware";

const metricsRouter = Router();
const controller = container.resolve(MetricsController);

metricsRouter.post(
  "/run",
  authenticateToken,
  requireRole(["admin"]),
  pipelineRateLimiter,
  controller.runPipeline,
);
metricsRouter.get(
  "/request-logs",
  authenticateToken,
  requireRole(["admin"]),
  authenticatedReadRateLimiter,
  controller.getRequestLogs,
);
metricsRouter.get(
  "/summary",
  authenticateToken,
  requireRole(["admin", "manager"]),
  authenticatedReadRateLimiter,
  controller.getSummary,
);
metricsRouter.get(
  "/establishment/:id",
  authenticateToken,
  requireRole(["admin", "manager"]),
  authenticatedReadRateLimiter,
  controller.getByEstablishmentId,
);
metricsRouter.get(
  "/establishment/:id/history",
  authenticateToken,
  requireRole(["admin", "manager"]),
  authenticatedReadRateLimiter,
  controller.getHistory,
);

export default metricsRouter;
