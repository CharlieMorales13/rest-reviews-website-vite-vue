import { Router } from "express";
import { container } from "../../config/container";
import { UploadController } from "../controllers/UploadController";
import { upload } from "../middlewares/UploadMiddleware";
import { authenticateToken } from "../middlewares/AuthMiddleware";
import { uploadRateLimiter } from "../middlewares/RateLimitMiddleware";

const uploadRouter = Router();
const controller = container.resolve(UploadController);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an image file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
uploadRouter.post(
  "/",
  authenticateToken,
  uploadRateLimiter,
  upload.single("file"),
  controller.uploadFile,
);

export default uploadRouter;
