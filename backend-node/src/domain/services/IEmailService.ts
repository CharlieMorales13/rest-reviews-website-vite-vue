export interface IEmailService {
  sendVerificationCode(to: string, name: string, code: string): Promise<void>;
}
