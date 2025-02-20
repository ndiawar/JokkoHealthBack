import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import mjml from 'mjml';
import nodemailer from 'nodemailer';
import path from 'path';

// Charger les variables d'environnement
import dotenv from 'dotenv';
dotenv.config();

// Obtenir le répertoire actuel de ce fichier (équivalent de __dirname en ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration du serveur de mail pour Gmail
export const mailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,  // false pour TLS, true pour SSL (465)
    auth: {
        user: process.env.SMTP_USER || 'dndiawar20@gmail.com',
        pass: process.env.SMTP_PASSWORD,  // Utilisation du mot de passe d'application Gmail
    },
};

// Création du transporteur Nodemailer
const transporter = nodemailer.createTransport(mailConfig);

// Fonction pour charger un template MJML et l'envoyer
const sendWelcomeEmail = async (to, subject, context) => {
    try {
        // Charger le template MJML depuis le répertoire
        const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'welcome.mjml');  // Correction du chemin
        const mjmlTemplate = fs.readFileSync(templatePath, 'utf8');

        // Remplacer les variables dans le template avec le contexte
        let htmlContent = mjmlTemplate;
        for (const key in context) {
            htmlContent = htmlContent.replace(`{{${key}}}`, context[key]);
        }

        // Convertir MJML en HTML
        const { html } = mjml(htmlContent);

        // Définir les options de l'email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'no-reply@yourdomain.com',  // Adresse de l'expéditeur
            to,
            subject,
            html,
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
};

// Exemple d'appel pour envoyer un email
const sendTestEmail = async () => {
    const context = {
        prenom: 'John',
        nom: 'Doe',
        username: 'johndoe',
        email: 'johndoe@example.com',
        loginLink: 'http://localhost:3000/login'
    };

    await sendWelcomeEmail('jokkohealth@gmail.com', 'Bienvenue sur JokkoHealth', context);
};

// Appeler la fonction pour tester l'envoi d'email
sendTestEmail();
