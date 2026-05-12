import { Router } from "express";
import { container } from "../../config/container";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middlewares/AuthMiddleware";
import {
  loginRateLimiter,
  registerRateLimiter,
  verifyEmailRateLimiter,
  resendVerificationRateLimiter,
  forgotPasswordRateLimiter,
} from "../middlewares/RateLimitMiddleware";

const authRouter = Router();
const authController = container.resolve(AuthController);

authRouter.post("/register", registerRateLimiter, authController.register);
authRouter.post("/login", loginRateLimiter, authController.login);
authRouter.post("/refresh", loginRateLimiter, authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/verify", verifyEmailRateLimiter, authController.verifyEmail);
authRouter.post(
  "/resend-verification",
  resendVerificationRateLimiter,
  authController.resendVerification,
);
authRouter.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  authController.forgotPassword,
);
authRouter.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
authRouter.get("/me", authenticateToken, authController.getMe);
authRouter.patch("/me", authenticateToken, authController.updateMe);
authRouter.patch(
  "/me/password",
  authenticateToken,
  authController.changePassword,
);

export default authRouter;
