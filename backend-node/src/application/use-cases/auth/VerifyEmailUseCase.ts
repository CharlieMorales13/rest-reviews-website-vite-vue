import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { VerifyEmailDTO } from "../../dtos/AuthDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import * as jwt from "jsonwebtoken";
import { env } from "../../../infrastructure/config/env.config";
import prisma from "../../../infrastructure/database/prisma.service";

interface VerifyEmailResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    username: string;
  };
  token: string;
  refreshToken: string;
}

@injectable()
export class VerifyEmailUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
  ) {}

  async execute(dto: VerifyEmailDTO): Promise<VerifyEmailResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.id) {
      throw new AppError("Invalid verification attempt", 400);
    }

    if (user.isVerified) {
      throw new AppError("Email already verified", 400);
    }

    if (!user.verificationCode || user.verificationCode !== dto.code) {
      throw new AppError("Invalid verification code", 400);
    }

    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      throw new AppError("Verification code has expired", 400);
    }

    user.verify();
    await this.userRepository.update(user);

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.create({
      data: { userId: user.id, refreshToken, expiresAt },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      token,
      refreshToken,
    };
  }
}
