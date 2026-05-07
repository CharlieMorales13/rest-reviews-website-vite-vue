import { Request, Response, NextFunction, CookieOptions } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/auth/RegisterUserUseCase";
import { LoginUserUseCase } from "../../../application/use-cases/auth/LoginUserUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/auth/RefreshTokenUseCase";
import { ChangePasswordUseCase } from "../../../application/use-cases/auth/ChangePasswordUseCase";
import { VerifyEmailUseCase } from "../../../application/use-cases/auth/VerifyEmailUseCase";
import { ResendVerificationUseCase } from "../../../application/use-cases/auth/ResendVerificationUseCase";
import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
} from "../../../application/dtos/AuthDTO";
import { injectable, inject } from "tsyringe";
import { env } from "../../config/env.config";

// ── Cookie helpers ────────────────────────────────────────────────────────────
const ACCESS_TTL = 60 * 60 * 1000; // 1 hour
const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function cookieBase(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

function setAuthCookies(res: Response, token: string, refreshToken: string) {
  res.cookie("access_token", token, { ...cookieBase(), maxAge: ACCESS_TTL });
  res.cookie("refresh_token", refreshToken, {
    ...cookieBase(),
    maxAge: REFRESH_TTL,
  });
}

function clearAuthCookies(res: Response) {
  const opts = cookieBase();
  res.clearCookie("access_token", opts);
  res.clearCookie("refresh_token", opts);
}

import { AuthRequest } from "../middlewares/AuthMiddleware";
import { GetUserUseCase } from "../../../application/use-cases/users/GetUserUseCase";
import { UpdateUserUseCase } from "../../../application/use-cases/users/UpdateUserUseCase";
import { UpdateProfileSchema } from "../../../application/dtos/UserDTO";

@injectable()
export class AuthController {
  constructor(
    @inject(RegisterUserUseCase)
    private registerUserUseCase: RegisterUserUseCase,
    @inject(LoginUserUseCase) private loginUserUseCase: LoginUserUseCase,
    @inject(RefreshTokenUseCase)
    private refreshTokenUseCase: RefreshTokenUseCase,
    @inject(GetUserUseCase) private getUserUseCase: GetUserUseCase,
    @inject(UpdateUserUseCase) private updateUserUseCase: UpdateUserUseCase,
    @inject(ChangePasswordUseCase)
    private changePasswordUseCase: ChangePasswordUseCase,
    @inject(VerifyEmailUseCase) private verifyEmailUseCase: VerifyEmailUseCase,
    @inject(ResendVerificationUseCase)
    private resendVerificationUseCase: ResendVerificationUseCase,
  ) {}

  /**
   * @swagger
   * /auth/me:
   *   patch:
   *     summary: Update current authenticated user profile
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserDTO'
   *     responses:
   *       200:
   *         description: Profile updated successfully
   */
  public updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validatedData = UpdateProfileSchema.parse(req.body);
    const user = await this.updateUserUseCase.execute(userId, validatedData);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        universityId: user.universityId,
        carrera: user.carrera,
        updatedAt: user.updatedAt,
      },
    });
  };

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current authenticated user info
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   */
  public getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await this.getUserUseCase.execute(userId);
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        universityId: user.universityId,
        carrera: user.carrera,
        createdAt: user.createdAt,
      },
    });
  };

  public register = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const validatedData = RegisterUserSchema.parse(req.body);
    const result = await this.registerUserUseCase.execute(validatedData);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  };

  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const validatedData = LoginUserSchema.parse(req.body);
    const result = await this.loginUserUseCase.execute(validatedData);
    setAuthCookies(res, result.token, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user } });
  };

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token using a valid refresh token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: New access token
   *       401:
   *         description: Invalid or expired refresh token
   *       429:
   *         description: Too many requests
   */
  public changePassword = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const dto = ChangePasswordSchema.parse(req.body);
    await this.changePasswordUseCase.execute(userId, dto);
    res
      .status(200)
      .json({ success: true, message: "Contraseña actualizada correctamente" });
  };

  public refresh = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: "No refresh token" });
      return;
    }
    const result = await this.refreshTokenUseCase.execute({ refreshToken });
    setAuthCookies(res, result.token, result.refreshToken);
    res.status(200).json({ success: true });
  };

  public logout = (_req: Request, res: Response): void => {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: "Logged out" });
  };

  public verifyEmail = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const validatedData = VerifyEmailSchema.parse(req.body);
    const result = await this.verifyEmailUseCase.execute(validatedData);
    setAuthCookies(res, result.token, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user } });
  };

  public resendVerification = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { email } = ResendVerificationSchema.parse(req.body);
    await this.resendVerificationUseCase.execute(email);
    res.status(200).json({ success: true, message: "Código reenviado" });
  };
}
