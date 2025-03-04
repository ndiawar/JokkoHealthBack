import User from '../../models/user/userModel.js'; // Importer le modèle utilisateur
import { validationResult } from 'express-validator'; // Importer les résultats de validation
import bcrypt from 'bcryptjs'; // Importer bcrypt pour le hachage des mots de passe
import jwt from 'jsonwebtoken'; // Importer jsonwebtoken pour la gestion des tokens
import crypto from 'crypto'; // Importer crypto pour la génération de tokens sécurisés
import emailService from '../../services/email/emailService.js'; // Importer le service d'email

class PasswordController {
    // 📌 Demande de réinitialisation de mot de passe (mot de passe oublié)
    async forgotPassword(req, res) {
        const { email } = req.body; // Récupérer l'email du corps de la requête

        if (!email) {
            return res.status(400).json({ message: "L'email est requis" }); // Vérifier si l'email est fourni
        }

        try {
            const user = await User.findOne({ email }); // Trouver l'utilisateur par email
            if (!user) {
                return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" }); // Vérifier si l'utilisateur existe
            }

            const timeDifference = Date.now() - user.lastResetPasswordAttempt; // Calculer la différence de temps depuis la dernière tentative
            const timeLimit = 3600000; // 1 heure en millisecondes
            const maxAttempts = 7; // Limite de tentatives

            if (user.resetPasswordAttempts >= maxAttempts && timeDifference < timeLimit) {
                return res.status(429).json({ message: `Trop de tentatives. Veuillez réessayer dans ${Math.floor(timeLimit / 60000)} minutes.` }); // Vérifier les tentatives récentes
            }

            if (timeDifference >= timeLimit) {
                user.resetPasswordAttempts = 0; // Réinitialiser les tentatives après 1 heure
            }

            user.resetPasswordAttempts += 1; // Mettre à jour les tentatives de réinitialisation
            user.lastResetPasswordAttempt = Date.now(); // Mettre à jour la dernière tentative
            await user.save(); // Sauvegarder l'utilisateur

            // Générer un token de réinitialisation sécurisé
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            user.resetPasswordToken = hashedToken; // Sauvegarder le token haché
            user.resetPasswordExpires = Date.now() + 3600000; // Expiration dans 1 heure
            await user.save(); // Sauvegarder l'utilisateur

            const resetUrl = `http://localhost:3000/create-password?token=${resetToken}&id=${user._id}`; // Construire l'URL de réinitialisation

            // Envoyer un email de réinitialisation avec le lien
            await emailService.sendEmail({
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                text: `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour le réinitialiser : ${resetUrl}`,
                html: `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le lien suivant pour le réinitialiser : <a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>`
            });

            return res.status(200).json({ message: "Un email de réinitialisation a été envoyé" }); // Répondre que l'email a été envoyé
        } catch (error) {
            console.error("Erreur lors de la réinitialisation du mot de passe:", error); // Gérer les erreurs
            return res.status(500).json({ message: "Erreur serveur" }); // Répondre avec une erreur serveur
        }
    }

    // 📌 Réinitialisation effective du mot de passe
    async resetPassword(req, res) {
        const { token, id } = req.query; // Récupérer le token et l'ID depuis l'URL
        const { newPassword, confirmPassword } = req.body; // Récupérer les mots de passe depuis le corps de la requête
    
        // Vérifications de base
        if (!token || !id || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Paramètres manquants" });
        }
    
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
        }
    
        try {
            // Hacher le token reçu
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
            // Trouver l'utilisateur avec le token haché et vérifier l'expiration
            const user = await User.findOne({
                _id: id,
                resetPasswordToken: hashedToken, // Comparer avec le token haché stocké
                resetPasswordExpires: { $gt: Date.now() } // Vérifier que le token n'a pas expiré
            });
    
            if (!user) {
                return res.status(400).json({ message: "Token invalide ou expiré" });
            }
    
            // Hacher le nouveau mot de passe
            user.motDePasse = await bcrypt.hash(newPassword, 10);
    
            // Réinitialiser les champs liés au token
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.resetPasswordAttempts = 0; // Réinitialiser les tentatives
            await user.save();
    
            // Envoyer un email de confirmation
            await emailService.sendEmail({
                to: user.email,
                subject: 'Votre mot de passe a été réinitialisé',
                text: 'Votre mot de passe a été mis à jour avec succès.',
                html: '<p>Votre mot de passe a été mis à jour avec succès.</p>'
            });
    
            // Réponse de succès
            return res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
    
        } catch (error) {
            console.error("Erreur dans resetPassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }

    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body; // Récupérer l'ancien et le nouveau mot de passe
        const userId = req.user.id; // Récupérer l'id de l'utilisateur authentifié
    
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
        }
    
        try {
            const user = await User.findById(userId); // Trouver l'utilisateur par id
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }
    
            const isMatch = await bcrypt.compare(currentPassword, user.motDePasse); // Comparer l'ancien mot de passe
            if (!isMatch) {
                return res.status(401).json({ message: "L'ancien mot de passe est incorrect" });
            }
    
            user.motDePasse = await bcrypt.hash(newPassword, 10); // Hacher le nouveau mot de passe
            await user.save(); // Sauvegarder l'utilisateur
    
            // Envoyer un email de confirmation
            await emailService.sendEmail({
                to: user.email,
                subject: 'Confirmation du changement de mot de passe',
                text: 'Votre mot de passe a été changé avec succès.',
                html: '<p>Votre mot de passe a été changé avec succès.</p>'
            });
    
            // Déconnecter l'utilisateur
            const token = req.cookies.jwt; // Récupérer le token JWT à partir des cookies
            if (!token) {
                return res.status(400).json({ message: "Token manquant" });
            }
    
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(400).json({ message: "Token invalide" });
            }
    
            // Ajouter le token à la liste noire
            const blacklistedToken = new BlacklistedToken({
                token,
                expiresAt: new Date(decoded.exp * 1000)
            });
    
            await blacklistedToken.save();
            res.clearCookie('jwt'); // Supprimer le cookie JWT
    
            // Réponse de succès
            return res.status(200).json({ message: "Mot de passe modifié avec succès. Vous avez été déconnecté." });
    
        } catch (error) {
            console.error("Erreur dans changePassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }
}

export default new PasswordController();
