export interface IEmailService {
    sendVerificationCode(to: string, code: string): Promise<void>;
    sendWelcomeEmail(to: string, name: string): Promise<void>;
}
