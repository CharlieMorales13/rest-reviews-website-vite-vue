import { injectable } from "tsyringe";
import { Resend } from "resend";
import { IEmailService } from "../../domain/services/IEmailService";
import { env } from "../config/env.config";
import {
  verificationEmailHtml,
  verificationEmailText,
} from "../email/templates/verificationEmail";
import {
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "../email/templates/passwordResetEmail";

@injectable()
export class ResendEmailService implements IEmailService {
  private resend = new Resend(env.RESEND_API_KEY);

  async sendVerificationCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: `${code} — Tu código de verificación | Anáhuac EATS`,
      html: verificationEmailHtml(name, code),
      text: verificationEmailText(name, code),
    });
  }

  async sendPasswordResetLink(
    to: string,
    name: string,
    link: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: `Restablece tu contraseña | Anáhuac EATS`,
      html: passwordResetEmailHtml(name, link),
      text: passwordResetEmailText(name, link),
    });
  }
}
