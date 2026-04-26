import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/auth/RegisterUserUseCase";
import { LoginUserUseCase } from "../../../application/use-cases/auth/LoginUserUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/auth/RefreshTokenUseCase";
import { ChangePasswordUseCase } from "../../../application/use-cases/auth/ChangePasswordUseCase";
import {
  RegisterUserSchema,
  LoginUserSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
} from "../../../application/dtos/AuthDTO";
import { injectable, inject } from "tsyringe";

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

    res.status(200).json({
      success: true,
      data: result,
    });
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
    const validatedData = RefreshTokenSchema.parse(req.body);
    const result = await this.refreshTokenUseCase.execute(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  };
}
