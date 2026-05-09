import { injectable, inject } from "tsyringe";
import * as jwt from "jsonwebtoken";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../domain/services/IEmailService";
import { env } from "../../../infrastructure/config/env.config";

@injectable()
export class ForgotPasswordUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IEmailService") private emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    const token = jwt.sign(
      { userId: user.id, purpose: "password-reset" },
      env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetLink(user.email, user.name, link);
  }
}
