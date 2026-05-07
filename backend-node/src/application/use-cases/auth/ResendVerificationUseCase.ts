import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../domain/services/IEmailService";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import * as crypto from "crypto";

@injectable()
export class ResendVerificationUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IEmailService") private emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    // Don't reveal whether the email exists
    if (!user || !user.id) return;

    if (user.isVerified) {
      throw new AppError("Email already verified", 400);
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    user.setVerificationCode(code, expiresAt);
    await this.userRepository.update(user);

    await this.emailService.sendVerificationCode(user.email, user.name, code);
  }
}
