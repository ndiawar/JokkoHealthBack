import User from '../../models/user/userModel.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import emailService from '../../services/email/emailService.js';

class PasswordController {

    // 📌 Demande de réinitialisation de mot de passe (mot de passe oublié)
    async forgotPassword(req, res) {
        const { email } = req.body;
    
        if (!email) {
            return res.status(400).json({ message: "L'email est requis" });
        }
    
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" });
            }
    
            // Vérifier les tentatives récentes
            const timeDifference = Date.now() - user.lastResetPasswordAttempt;
            const timeLimit = 3600000; // 1 heure en millisecondes
    
            if (user.resetPasswordAttempts >= 2 && timeDifference < timeLimit) {
                return res.status(429).json({ message: "Trop de tentatives. Veuillez réessayer dans une heure." });
            }
    
            // Mettre à jour les tentatives de réinitialisation de mot de passe
            if (timeDifference >= timeLimit) {
                user.resetPasswordAttempts = 0; // Réinitialiser le compteur si une heure s'est écoulée
            }
    
            user.resetPasswordAttempts += 1;
            user.lastResetPasswordAttempt = Date.now();
            await user.save();
    
            // Générer un token sécurisé (par exemple avec crypto)
            const resetToken = crypto.randomBytes(32).toString('hex');
            // Hash le token avant de le sauvegarder en base pour éviter qu'il soit utilisé tel quel en cas de fuite
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
            // Sauvegarde du token et date d'expiration (par exemple 1h) dans l’utilisateur
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
            await user.save();
    
            // Construire le lien de réinitialisation (à adapter à ton front-end)
            const resetUrl = `https://jokkohealth.com/reset-password?token=${resetToken}&id=${user._id}`;
    
            // Envoi de l'email via ton service d'email
            await emailService.sendEmail({
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                text: `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour le réinitialiser : ${resetUrl}`,
                html: `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                       <p>Cliquez sur le lien suivant pour le réinitialiser : <a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>`
            });
    
            return res.status(200).json({ message: "Un email de réinitialisation a été envoyé" });
        } catch (error) {
            console.error("Erreur dans forgotPassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }
    

    // 📌 Réinitialisation effectif du mot de passe
    async resetPassword(req, res) {
        const { token, id } = req.query;
        const { newPassword } = req.body;

        if (!token || !id || !newPassword) {
            return res.status(400).json({ message: "Token, id et nouveau mot de passe requis" });
        }

        try {
            // Hash le token fourni pour comparer avec celui stocké en base
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Trouver l'utilisateur dont le token correspond et qui n'est pas expiré
            const user = await User.findOne({ 
                _id: id,
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ message: "Token invalide ou expiré" });
            }

            // Hacher le nouveau mot de passe
            user.motDePasse = await bcrypt.hash(newPassword, 10);
            // Réinitialiser les champs de token
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            // Optionnel : envoyer un email de confirmation de changement de mot de passe
            await emailService.sendEmail({
                to: user.email,
                subject: 'Votre mot de passe a été réinitialisé',
                text: 'Votre mot de passe a été mis à jour avec succès.',
                html: '<p>Votre mot de passe a été mis à jour avec succès.</p>'
            });

            return res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
        } catch (error) {
            console.error("Erreur dans resetPassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }

    // 📌 Changer de mot de passe pour un utilisateur authentifié
    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // Assure-toi que le middleware d'authentification définit req.user

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            // Vérifier que l'ancien mot de passe est correct
            const isMatch = await bcrypt.compare(currentPassword, user.motDePasse);
            if (!isMatch) {
                return res.status(401).json({ message: "L'ancien mot de passe est incorrect" });
            }

            // Hacher et sauvegarder le nouveau mot de passe
            user.motDePasse = await bcrypt.hash(newPassword, 10);
            await user.save();

            // Optionnel : envoyer un email de confirmation
            await emailService.sendEmail({
                to: user.email,
                subject: 'Confirmation du changement de mot de passe',
                text: 'Votre mot de passe a été changé avec succès.',
                html: '<p>Votre mot de passe a été changé avec succès.</p>'
            });

            return res.status(200).json({ message: "Mot de passe modifié avec succès" });
        } catch (error) {
            console.error("Erreur dans changePassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }
}

export default new PasswordController();
