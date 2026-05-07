import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { LoginUserDTO } from "../../dtos/AuthDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { env } from "../../../infrastructure/config/env.config";
import prisma from "../../../infrastructure/database/prisma.service";

interface LoginResponse {
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
export class LoginUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
  ) {}

  async execute(dto: LoginUserDTO): Promise<LoginResponse> {
    const byEmail = await this.userRepository.findByEmail(dto.email);
    const user =
      byEmail ?? (await this.userRepository.findByUsername(dto.email));

    if (!user || !user.isActive || !user.id) {
      throw new AppError("Invalid credentials or inactive account", 401);
    }

    if (!user.isVerified) {
      throw new AppError("EMAIL_NOT_VERIFIED", 403);
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

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
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
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
