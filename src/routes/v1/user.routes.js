import express from 'express';
import UserController from '../../controllers/users/userController.js';
import { userValidator } from '../../middlewares/validation/userValidation.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import roleCheck from '../../middlewares/auth/roleCheck.js';  // Import du middleware de vérification des rôles

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     description: Retourne la liste complète des utilisateurs enregistrés dans la base de données.
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès.
 *       500:
 *         description: Erreur interne du serveur.
 */
router.get('/', authenticate, UserController.list.bind(UserController));

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Récupérer les informations de l'utilisateur connecté
 *     description: Retourne les informations de l'utilisateur connecté.
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Informations de l'utilisateur récupérées avec succès.
 *       401:
 *         description: Utilisateur non authentifié.
 */
router.get('/me', authenticate, UserController.getMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     description: Retourne les informations d'un utilisateur spécifique en fonction de son ID.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       200:
 *         description: Informations de l'utilisateur récupérées avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.get('/:id', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']),  UserController.read.bind(UserController));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     description: Met à jour toutes les informations d'un utilisateur en fonction de son ID.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Diop"
 *               prenom:
 *                 type: string
 *                 example: "Ndiawar"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ndiawar@example.com"
 *               role:
 *                 type: string
 *                 enum: [ "Patient", "Médecin", "SuperAdmin" ]
 *                 example: "Médecin"
 *               dateNaissance:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-15"
 *               sexe:
 *                 type: string
 *                 enum: [ "Homme", "Femme" ]
 *                 example: "Homme"
 *               telephone:
 *                 type: string
 *                 example: "774123456"
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - role
 *               - telephone
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès.
 *       400:
 *         description: Données invalides.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.put('/:id', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.updateProfile,  UserController.update.bind(UserController));

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Mettre à jour un utilisateur de manière partielle
 *     description: Met à jour certaines informations d'un utilisateur en fonction de son ID.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Diop"
 *               prenom:
 *                 type: string
 *                 example: "Ndiawar"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ndiawar@example.com"
 *               role:
 *                 type: string
 *                 enum: [ "Patient", "Médecin", "SuperAdmin" ]
 *                 example: "Médecin"
 *               dateNaissance:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-15"
 *               sexe:
 *                 type: string
 *                 enum: [ "Homme", "Femme" ]
 *                 example: "Homme"
 *               telephone:
 *                 type: string
 *                 example: "774123456"
 *             required: []
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour partiellement avec succès.
 *       400:
 *         description: Données invalides.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.patch('/:id', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.updateProfile,  UserController.update.bind(UserController));

/**
 * @swagger
 * /users/{id}/block:
 *   put:
 *     summary: Bloquer un utilisateur
 *     description: Bloque un utilisateur spécifique en fonction de son ID et lui envoie un email de notification.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       200:
 *         description: Utilisateur bloqué avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 *       400:
 *         description: L'utilisateur est déjà bloqué.
 */
router.put('/:id/block', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.blockUser);

/**
 * @swagger
 * /users/{id}/unblock:
 *   put:
 *     summary: Débloquer un utilisateur
 *     description: Débloque un utilisateur spécifique en fonction de son ID et lui envoie un email de notification.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       200:
 *         description: Utilisateur débloqué avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 *       400:
 *         description: L'utilisateur n'est pas bloqué.
 */
router.put('/:id/unblock', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.unblockUser);

/**
 * @swagger
 * /users/{id}/archive:
 *   put:
 *     summary: Archiver un utilisateur
 *     description: Archive un utilisateur spécifique en fonction de son ID et lui envoie un email de notification.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       200:
 *         description: Utilisateur archivé avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 *       400:
 *         description: L'utilisateur est déjà archivé.
 */
router.put('/:id/archive', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.archiveUser);

/**
 * @swagger
 * /users/{id}/unarchive:
 *   put:
 *     summary: Désarchiver un utilisateur
 *     description: Désarchive un utilisateur spécifique en fonction de son ID, le remet à l'état actif et lui envoie un email de notification.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       200:
 *         description: Utilisateur désarchivé avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 *       400:
 *         description: L'utilisateur n'est pas archivé ou ne peut pas être désarchivé.
 */
router.put('/:id/unarchive', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.unarchiveUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Supprime un utilisateur spécifique en fonction de son ID.
 *     tags: [Utilisateurs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur.
 *     responses:
 *       204:
 *         description: Utilisateur supprimé avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.delete('/:id', authenticate, roleCheck(['Patient', 'Medecin', 'SuperAdmin']), UserController.delete.bind(UserController));

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Crée un nouvel utilisateur avec les informations fournies.
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Diop"
 *               prenom:
 *                 type: string
 *                 example: "Ndiawar"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ndiawar@example.com"
 *               role:
 *                 type: string
 *                 enum: [ "Patient", "Médecin", "SuperAdmin" ]
 *                 example: "Médecin"
 *               dateNaissance:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-15"
 *               sexe:
 *                 type: string
 *                 enum: [ "Homme", "Femme" ]
 *                 example: "Homme"
 *               telephone:
 *                 type: string
 *                 example: "774123456"
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - role
 *               - telephone
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès.
 *       400:
 *         description: Données invalides.
 */
router.post('/register', authenticate, userValidator.register, UserController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Permet à un utilisateur de se connecter et d'obtenir un jeton d'authentification.
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "jean.dupont@example.com"
 *               motDePasse:
 *                 type: string
 *                 example: "MotDePasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *       401:
 *         description: Identifiants invalides.
 */
router.post('/login', userValidator.login, UserController.login);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     description: Déconnexion utilisateur en ajoutant son jeton à la liste noire.
 *     summary: Déconnecte un utilisateur en invalidant son token d'authentification.
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Déconnexion réussie.
 *       400:
 *         description: Token manquant ou invalide.
 *       500:
 *         description: Erreur serveur lors de la déconnexion.
 */
router.post('/logout', authenticate, UserController.logout);

export default router;
