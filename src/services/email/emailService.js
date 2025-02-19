// src/services/email/emailService.js
import nodemailer from 'nodemailer';
import { mailConfig } from '../../config/mail.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport(mailConfig);
    }

    // Méthode pour envoyer un email
    async sendEmail(to, subject, text, html) {
        const mailOptions = {
            from: mailConfig.from,
            to,
            subject,
            text,
            html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    // Méthode pour envoyer un email de réinitialisation de mot de passe
    async sendPasswordResetEmail(to, token) {
        const subject = 'Password Reset Request';
        const text = `Please use the following link to reset your password: http://example.com/reset-password?token=${token}`;
        const html = `<p>Please use the following link to reset your password: <a href="http://example.com/reset-password?token=${token}">Reset Password</a></p>`;

        try {
            await this.sendEmail(to, subject, text, html);
        } catch (error) {
            throw new Error(`Failed to send password reset email: ${error.message}`);
        }
    }

    // Méthode pour envoyer un email de bienvenue
    async sendWelcomeEmail(to) {
        const subject = 'Welcome to JokkoHealth!';
        const text = `Welcome to JokkoHealth! We're happy to have you with us.`;
        const html = `<h1>Welcome to JokkoHealth!</h1><p>We're happy to have you with us.</p>`;
        return this.sendEmail(to, subject, text, html);
    }
}

// Exporter l'instance d'EmailService
export default new EmailService();
