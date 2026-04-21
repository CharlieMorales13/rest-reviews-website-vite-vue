import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { RefreshTokenDTO } from "../../dtos/AuthDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import * as jwt from "jsonwebtoken";
import prisma from "../../../infrastructure/database/prisma.service";
import { env } from "../../../infrastructure/config/env.config";

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshResponse> {
    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(dto.refreshToken, env.JWT_SECRET) as {
        userId: string;
        type: string;
      };
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    if (payload.type !== "refresh") {
      throw new AppError("Invalid token type", 401);
    }

    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken: dto.refreshToken,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new AppError("Refresh token not found or has been revoked", 401);
    }

    const user = await this.userRepository.findById(payload.userId);

    if (!user || !user.isActive || !user.id) {
      throw new AppError("User not found or inactive", 401);
    }

    // Revoke the used refresh token (one-time use)
    await prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Issue a new rotated refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    return { token, refreshToken: newRefreshToken };
  }
}
