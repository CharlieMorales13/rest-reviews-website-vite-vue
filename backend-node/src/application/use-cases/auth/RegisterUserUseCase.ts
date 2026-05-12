import { injectable, inject } from "tsyringe";
import { User, UserRole } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../domain/services/IEmailService";
import { RegisterUserDTO } from "../../dtos/AuthDTO";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import * as argon2 from "argon2";
import * as crypto from "crypto";

interface RegisterResponse {
  email: string;
  maskedEmail: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const masked =
    local.length <= 2
      ? local[0] + "*"
      : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
}

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IEmailService") private emailService: IEmailService,
  ) {}

  async execute(dto: RegisterUserDTO): Promise<RegisterResponse> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const existingUsername = await this.userRepository.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new AppError("Este username ya está en uso", 409);
    }

    const hashedPassword = await argon2.hash(dto.password);

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const newUser = User.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      isVerified: false,
      carrera: dto.carrera,
      verificationCode: code,
      verificationExpires: expiresAt,
    });

    await this.userRepository.save(newUser);

    await this.emailService.sendVerificationCode(dto.email, dto.name, code);

    return { email: dto.email, maskedEmail: maskEmail(dto.email) };
  }
}
