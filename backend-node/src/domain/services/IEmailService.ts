export interface IEmailService {
  sendVerificationCode(to: string, name: string, code: string): Promise<void>;
  sendPasswordResetLink(to: string, name: string, link: string): Promise<void>;
}
