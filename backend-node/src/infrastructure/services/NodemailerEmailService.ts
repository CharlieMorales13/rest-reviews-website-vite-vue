import nodemailer from 'nodemailer';
import { IEmailService } from '../../application/services/IEmailService';
import { injectable } from 'tsyringe';

@injectable()
export class NodemailerEmailService implements IEmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: parseInt(process.env.SMTP_PORT || '2525'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendVerificationCode(to: string, code: string): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Sistema Anáhuac" <noreply@anahuac.mx>',
            to,
            subject: 'Código de Verificación - Sistema Anáhuac',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff7900; text-align: center;">Verifica tu Cuenta</h2>
                    <p>Hola,</p>
                    <p>Gracias por registrarte en el Sistema de Inteligencia Operativa de la Universidad Anáhuac. Para completar tu registro, por favor ingresa el siguiente código de 6 dígitos en la aplicación:</p>
                    <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>Este código expirará en 1 hora.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Universidad Anáhuac. Por favor, no respondas a este correo.</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`[EmailService] Verification code sent to ${to}`);
        } catch (error) {
            console.error('[EmailService] Error sending email:', error);
            // We don't throw here to avoid failing registration if email fails, 
            // but in production we might want to retry or log it properly.
        }
    }

    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Sistema Anáhuac" <noreply@anahuac.mx>',
            to,
            subject: '¡Bienvenido al Sistema Anáhuac!',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff7900; text-align: center;">¡Bienvenido, ${name}!</h2>
                    <p>Tu cuenta ha sido verificada con éxito.</p>
                    <p>Ya puedes acceder a todas las funcionalidades del Sistema de Inteligencia Operativa.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #ff7900; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Portal</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Universidad Anáhuac.</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[EmailService] Error sending welcome email:', error);
        }
    }
}
