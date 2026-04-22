import "reflect-metadata"; // Must be imported before everything else for DI to work properly
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import cron from "node-cron";

// Application Imports
import { env } from "../config/env.config";
import { logger } from "../config/logger";
import { swaggerSpec } from "../config/swagger.config";
import { container } from "../config/container";
import { RunAnalyticsUseCase } from "../../application/use-cases/metrics/RunAnalyticsUseCase";
import authRouter from "./routes/auth.routes";
import reviewRouter from "./routes/review.routes";
import establishmentRouter from "./routes/establishment.routes";
import userRouter from "./routes/user.routes";
import metricsRouter from "./routes/metrics.routes";
import uploadRouter from "./routes/upload.routes";
import notificationRouter from "./routes/notification.routes";
import { globalErrorHandler } from "./middlewares/ErrorMiddleware";
import { requestLoggerMiddleware } from "./middlewares/RequestLoggerMiddleware";

const app = express();
const PORT = env.PORT;

// Security & Utility Middlewares
app.use(helmet());
const allowedOrigins =
  env.NODE_ENV === "production"
    ? (process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : ["http://localhost:5173", "http://localhost:4173"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Replace Morgan with Pino for structured logging
app.use(pinoHttp({ logger }));

// In-memory request log store (admin monitoring)
app.use(requestLoggerMiddleware);

// Health Check
app.get("/health", (_req: Request, res: Response) => {
  logger.info("Health check called");
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Swagger Documentation Route — disabled in production
if (env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/establishments", establishmentRouter);
app.use("/api/users", userRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/notifications", notificationRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Nightly analytics pipeline — runs at 02:00 AM every day
cron.schedule("0 2 * * *", async () => {
  logger.info("[cron] Running nightly analytics pipeline...");
  try {
    const useCase = container.resolve(RunAnalyticsUseCase);
    const result = await useCase.execute();
    logger.info({ result }, "[cron] Analytics pipeline completed");
  } catch (err) {
    logger.error({ err }, "[cron] Analytics pipeline failed");
  }
});

// Start Server (If explicitly run, not exported)
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(
      `📚 Swagger docs available at: http://localhost:${PORT}/api/docs`,
    );
    logger.info(`💓 Check health at: http://localhost:${PORT}/health`);
  });
}

export default app;
