import { injectable, inject } from "tsyringe";
import * as jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ResetPasswordDTO } from "../../dtos/AuthDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import { env } from "../../../infrastructure/config/env.config";
import prisma from "../../../infrastructure/database/prisma.service";

@injectable()
export class ResetPasswordUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(dto.token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AppError(
        "El enlace de restablecimiento ha expirado o es inválido",
        400,
      );
    }

    if (payload.purpose !== "password-reset" || !payload.userId) {
      throw new AppError("Invalid reset token", 400);
    }

    const user = await this.userRepository.findById(payload.userId as string);
    if (!user) throw new AppError("User not found", 404);

    const newHash = await argon2.hash(dto.newPassword);
    user.updatePasswordHash(newHash);
    await this.userRepository.update(user);

    await prisma.userSession.deleteMany({ where: { userId: user.id } });
  }
}
