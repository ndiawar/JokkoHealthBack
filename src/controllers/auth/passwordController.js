import User from '../../models/user/userModel.js'; // Importer le modèle utilisateur
import BlacklistedToken from '../../models/auth/blacklistedToken.js'; // Import du modèle
import { validationResult } from 'express-validator'; // Importer les résultats de validation
import bcrypt from 'bcryptjs'; // Importer bcrypt pour le hachage des mots de passe
import jwt from 'jsonwebtoken'; // Importer jsonwebtoken pour la gestion des tokens
import crypto from 'crypto'; // Importer crypto pour la génération de tokens sécurisés
import emailService from '../../services/email/emailService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mjml from 'mjml';
import fs from 'fs';

// Utilisation de fileURLToPath pour obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PasswordController {
    // Méthode privée pour vérifier le mot de passe actuel
    _verifyPassword = async (user, password) => {
        return await bcrypt.compare(password, user.motDePasse);
    }

    // 📌 Demande de réinitialisation de mot de passe (mot de passe oublié)
    async forgotPassword(req, res) {
        console.log("Début de forgotPassword");
        console.log("Corps de la requête:", req.body);
        const { email } = req.body; // Récupérer l'email du corps de la requête

        if (!email) {
            console.log("Email manquant dans la requête");
            return res.status(400).json({ message: "L'email est requis" }); // Vérifier si l'email est fourni
        }

        try {
            console.log("Recherche de l'utilisateur avec l'email:", email);
            const user = await User.findOne({ email }); // Trouver l'utilisateur par email
            if (!user) {
                console.log("Aucun utilisateur trouvé avec cet email");
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

            const resetUrl = `https://jokko-health-front-end.vercel.app/create-password?token=${resetToken}&id=${user._id}`; // Construire l'URL de réinitialisation

            // Charger le template MJML
            const mjmlFilePath = path.join(__dirname, '../../../src/templates/emails/resetPassword/resetPassword.mjml');
            const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8');

            // Compiler le MJML en HTML
            const { html } = mjml(mjmlContent);

            // Remplacer les variables dynamiques
            const htmlContent = html
                .replace('{{prenom}}', user.prenom)
                .replace('{{nom}}', user.nom)
                .replace('{{resetLink}}', resetUrl);

            // Envoyer l'email
            await emailService.sendEmail({
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                text: `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour le réinitialiser : ${resetUrl}`,
                html: htmlContent
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
    
            // Charger le template MJML
            const mjmlFilePath = path.join(__dirname, '../../../src/templates/emails/passwordChanged/passwordChanged.mjml');
            const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8');

            // Compiler le MJML en HTML
            const { html } = mjml(mjmlContent);

            // Remplacer les variables dynamiques
            const htmlContent = html
                .replace('{{prenom}}', user.prenom)
                .replace('{{nom}}', user.nom)
                .replace('{{loginLink}}', 'https://jokko-health-front-end.vercel.app/login'); // Lien vers la page de connexion

            // Envoyer l'email
            await emailService.sendEmail({
                to: user.email,
                subject: 'Réinitialisation de mot de passe réussie',
                text: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter à votre compte.',
                html: htmlContent
            });
    
            // Réponse de succès
            return res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
    
        } catch (error) {
            console.error("Erreur dans resetPassword:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }

    changePassword = async (req, res) => {
        console.log("Début de changePassword");
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user?.id;

        console.log("Données reçues:", { userId, currentPassword: currentPassword ? "présent" : "absent", newPassword: newPassword ? "présent" : "absent", confirmPassword: confirmPassword ? "présent" : "absent" });

        // Validation des champs requis
        if (!currentPassword || !newPassword || !confirmPassword) {
            console.log("Champs manquants:", {
                currentPassword: !currentPassword,
                newPassword: !newPassword,
                confirmPassword: !confirmPassword
            });
            return res.status(400).json({ 
                message: "Tous les champs sont requis",
                details: {
                    currentPassword: !currentPassword ? "L'ancien mot de passe est requis" : null,
                    newPassword: !newPassword ? "Le nouveau mot de passe est requis" : null,
                    confirmPassword: !confirmPassword ? "La confirmation du mot de passe est requise" : null
                }
            });
        }

        // Validation de la correspondance des mots de passe
        if (newPassword !== confirmPassword) {
            console.log("Les mots de passe ne correspondent pas");
            return res.status(400).json({ 
                message: "Les nouveaux mots de passe ne correspondent pas" 
            });
        }

        try {
            console.log("Recherche de l'utilisateur avec l'ID:", userId);
            const user = await User.findById(userId);
            if (!user) {
                console.log("Utilisateur non trouvé");
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            // Vérification des tentatives de changement de mot de passe
            const timeDifference = Date.now() - user.lastPasswordChangeAttempt;
            const timeLimit = 3600000; // 1 heure en millisecondes
            const maxAttempts = 5;

            console.log("Vérification des tentatives:", {
                attempts: user.passwordChangeAttempts,
                timeDifference,
                timeLimit,
                maxAttempts
            });

            if (user.passwordChangeAttempts >= maxAttempts && timeDifference < timeLimit) {
                console.log("Trop de tentatives");
                return res.status(429).json({ 
                    message: `Trop de tentatives. Veuillez réessayer dans ${Math.floor((timeLimit - timeDifference) / 60000)} minutes.` 
                });
            }

            // Vérification du mot de passe actuel
            console.log("Vérification du mot de passe actuel");
            const isValid = await this._verifyPassword(user, currentPassword);
            console.log("Résultat de la vérification:", isValid);

            if (!isValid) {
                console.log("Mot de passe actuel incorrect");
                user.passwordChangeAttempts += 1;
                user.lastPasswordChangeAttempt = Date.now();
                await user.save();
                
                return res.status(401).json({ 
                    message: "L'ancien mot de passe est incorrect",
                    attemptsRemaining: maxAttempts - user.passwordChangeAttempts
                });
            }

            // Vérification que le nouveau mot de passe est différent de l'ancien
            if (currentPassword === newPassword) {
                console.log("Le nouveau mot de passe est identique à l'ancien");
                return res.status(400).json({ 
                    message: "Le nouveau mot de passe doit être différent de l'ancien" 
                });
            }

            // Validation de la force du nouveau mot de passe
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                console.log("Le nouveau mot de passe ne respecte pas les critères de force");
                return res.status(400).json({
                    message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
                });
            }

            // Mise à jour du mot de passe
            console.log("Hachage du nouveau mot de passe");
            user.motDePasse = await bcrypt.hash(newPassword, 12); // Augmentation du coût de hachage
            user.passwordChangeAttempts = 0;
            user.lastPasswordChangeAttempt = Date.now();
            user.passwordChangedAt = Date.now();
            console.log("Sauvegarde de l'utilisateur");
            await user.save();

            // Récupération et invalidation de tous les tokens existants
            console.log("Vérification du token JWT");
            const token = req.cookies.jwt;
            if (token) {
                try {
                    console.log("Vérification et décodage du token");
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded) {
                        console.log("Création du token blacklisté");
                        const blacklistedToken = new BlacklistedToken({
                            token,
                            expiresAt: new Date(decoded.exp * 1000),
                            reason: 'password_change'
                        });
                        await blacklistedToken.save();
                    }
                } catch (jwtError) {
                    console.error("Erreur lors de la vérification du token:", jwtError);
                }
            }

            // Envoi de l'email de confirmation
            console.log("Préparation de l'email de confirmation");
            const mjmlFilePath = path.join(__dirname, '../../../src/templates/emails/passwordChanged/passwordChanged.mjml');
            const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8');
            const { html } = mjml(mjmlContent);
            const htmlContent = html
                .replace('{{prenom}}', user.prenom)
                .replace('{{nom}}', user.nom)
                .replace('{{loginLink}}', 'https://jokko-health-front-end.vercel.app/login');

            console.log("Envoi de l'email");
            await emailService.sendEmail({
                to: user.email,
                subject: 'Confirmation du changement de mot de passe',
                text: 'Votre mot de passe a été changé avec succès.',
                html: htmlContent
            });

            // Nettoyage des cookies
            console.log("Nettoyage des cookies");
            res.clearCookie('jwt');

            console.log("Changement de mot de passe réussi");
            return res.status(200).json({ 
                message: "Mot de passe modifié avec succès. Vous avez été déconnecté.",
                security: {
                    passwordChangedAt: user.passwordChangedAt,
                    nextPasswordChangeAllowed: new Date(Date.now() + timeLimit)
                }
            });

        } catch (error) {
            console.error("Erreur détaillée dans changePassword:", {
                userId,
                error: error.message,
                stack: error.stack,
                name: error.name
            });
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: "Token invalide" });
            }
            
            return res.status(500).json({ 
                message: "Une erreur est survenue lors du changement de mot de passe",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 📌 Vérification du mot de passe actuel
    verifyCurrentPassword = async (req, res) => {
        console.log("Début de verifyCurrentPassword");
        const { currentPassword } = req.body;
        const userId = req.user?.id;

        console.log("Données reçues:", { currentPassword, userId });

        if (!currentPassword) {
            console.log("Mot de passe actuel manquant");
            return res.status(400).json({ 
                message: "Le mot de passe actuel est requis",
                isValid: false
            });
        }

        if (!userId) {
            console.log("ID utilisateur manquant dans la requête");
            return res.status(401).json({ 
                message: "Utilisateur non authentifié",
                isValid: false
            });
        }

        try {
            console.log("Recherche de l'utilisateur avec l'ID:", userId);
            const user = await User.findById(userId);
            if (!user) {
                console.log("Utilisateur non trouvé");
                return res.status(404).json({ 
                    message: "Utilisateur non trouvé",
                    isValid: false
                });
            }

            console.log("Vérification du mot de passe");
            const isValid = await this._verifyPassword(user, currentPassword);
            console.log("Résultat de la vérification:", isValid);
            
            return res.status(200).json({ 
                message: isValid ? "Mot de passe correct" : "Mot de passe incorrect",
                isValid
            });

        } catch (error) {
            console.error("Erreur détaillée dans verifyCurrentPassword:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            return res.status(500).json({ 
                message: "Erreur serveur",
                isValid: false,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

export default new PasswordController();
