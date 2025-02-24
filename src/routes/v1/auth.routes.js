import express from 'express'; // Ajoutez cette ligne pour importer express
import { validateLogin, validateRegistration } from '../../middlewares/validation/authValidation.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import PasswordController from '../../controllers/auth/passwordController.js';
import { passwordValidator } from '../../middlewares/validation/passwordValidation.js';



const router = express.Router();

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
router.post('/forgot-password', passwordValidator.forgotPassword, PasswordController.forgotPassword);

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
router.post('/reset-password', passwordValidator.resetPassword, PasswordController.resetPassword);

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
router.post('/change-password', authenticate, passwordValidator.changePassword, PasswordController.changePassword);

// Protected routes
router.get('/profile', authenticate, (req, res) => {
    res.send('Profile route');
});

export default router;
