import nodemailer from 'nodemailer';
import { mailConfig } from '../../config/mail.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport(mailConfig);
    }

    // Méthode générique pour envoyer un e-mail
    async sendEmail(emailData) {
        const { to, subject, text, html } = emailData;
        const mailOptions = {
            from: mailConfig.from,
            to,
            subject,
            text,
            html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return info; // Retourne les informations de l'email envoyé
        } catch (error) {
            throw new Error(`Échec de l'envoi de l'e-mail : ${error.message}`);
        }
    }

    // Méthode pour envoyer un e-mail de réinitialisation de mot de passe
    async sendPasswordResetEmail(to, token) {
        const subject = 'Demande de réinitialisation de mot de passe';
        const text = `Veuillez utiliser le lien suivant pour réinitialiser votre mot de passe : http://example.com/reset-password?token=${token}`;
        const html = `<p>Veuillez utiliser le lien suivant pour réinitialiser votre mot de passe : <a href="http://example.com/reset-password?token=${token}">Réinitialiser le mot de passe</a></p>`;

        try {
            await this.sendEmail(to, subject, text, html); // Envoi de l'email
        } catch (error) {
            throw new Error(`Échec de l'envoi de l'e-mail de réinitialisation de mot de passe : ${error.message}`);
        }
    }

    // Méthode pour envoyer un e-mail de bienvenue
    async sendWelcomeEmail(to) {
        const subject = 'Bienvenue sur JokkoHealth!';
        const text = `Bienvenue sur JokkoHealth ! Nous sommes ravis de vous accueillir parmi nous.`;
        const html = `<h1>Bienvenue sur JokkoHealth !</h1><p>Nous sommes ravis de vous accueillir parmi nous.</p>`;
        return this.sendEmail(to, subject, text, html); // Envoi de l'email
    }
}

// Exporter une instance d'EmailService
export default new EmailService();
