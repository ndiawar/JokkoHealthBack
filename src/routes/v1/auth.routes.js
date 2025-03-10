import express from 'express'; // Importer express
import { validateLogin, validateRegistration } from '../../middlewares/validation/authValidation.js'; // Importer les validations
import { authenticate } from '../../middlewares/auth/authenticate.js'; // Importer le middleware d'authentification
import PasswordController from '../../controllers/auth/passwordController.js'; // Importer le contrôleur de mot de passe
import { passwordValidator } from '../../middlewares/validation/passwordValidation.js'; // Importer les validations de mot de passe
import logAction from '../../middlewares/logs/logMiddleware.js';

const router = express.Router(); // Créer un routeur express

/**
 * @swagger
 * tags:
 *   name: Gestion Mot de passe
 *   description: Gestion de la réinitialisation et changement du mot de passe
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demande de réinitialisation du mot de passe
 *     description: Envoie un email de réinitialisation du mot de passe à l'utilisateur.
 *     tags: [Gestion Mot de passe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé avec succès.
 *       400:
 *         description: Données invalides.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.post('/forgot-password', logAction, passwordValidator.forgotPassword, PasswordController.forgotPassword); // Route pour demander la réinitialisation du mot de passe

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialisation du mot de passe
 *     description: Permet à l'utilisateur de réinitialiser son mot de passe via un token reçu par email.
 *     tags: [Gestion Mot de passe]
 *     parameters:
 *       - name: token
 *         in: query
 *         description: Token de réinitialisation envoyé par email.
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: query
 *         description: Identifiant de l'utilisateur.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "nouveauMDP"
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "nouveauMDP"
 *             required:
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès.
 *       400:
 *         description: Données invalides ou token expiré.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.post('/reset-password', logAction, passwordValidator.resetPassword, PasswordController.resetPassword); // Route pour réinitialiser le mot de passe

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Changement de mot de passe (authentifié)
 *     description: Permet à un utilisateur connecté de changer son mot de passe en fournissant l'ancien, le nouveau et la confirmation.
 *     tags: [Gestion Mot de passe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "ancienMDP"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "nouveauMDP"
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "nouveauMDP"
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès.
 *       400:
 *         description: Données invalides ou ancien mot de passe incorrect.
 *       401:
 *         description: Non authentifié.
 */
router.post('/change-password', logAction, authenticate, passwordValidator.changePassword, PasswordController.changePassword); // Route pour changer le mot de passe

// Protected routes
router.get('/profile', authenticate, (req, res) => {
    res.send('Profile route'); // Route protégée pour le profil
});

export default router; // Exporter le routeur
