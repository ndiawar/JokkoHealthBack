import express from 'express';
import { createChat, findChat, userChats, listChats } from '../../controllers/chats/ChatController.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import roleCheck from '../../middlewares/auth/roleCheck.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Gestion des conversations et des messages du chat
 */

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Créer un chat
 *     description: Crée un nouveau chat entre deux utilisateurs.
 *     tags: [Chat]  # Ajout du tag ici
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *                 example: '67b74745dea578a10872721e'
 *               receiverId:
 *                 type: string
 *                 example: '67b74756dea578a108727220'
 *     responses:
 *       200:
 *         description: Chat créé avec succès
 *       500:
 *         description: Erreur lors de la création du chat
 */
router.post('/', authenticate, roleCheck(['Patient', 'Medecin']), createChat);

/**
 * @swagger
 * /chats/{userId}:
 *   get:
 *     summary: Récupérer les chats d'un utilisateur
 *     description: Récupère tous les chats associés à un utilisateur spécifique.
 *     tags: [Chat]  # Ajout du tag ici
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID de l'utilisateur pour lequel récupérer les chats
 *         schema:
 *           type: string
 *           example: '67b74745dea578a10872721e'
 *     responses:
 *       200:
 *         description: Liste des chats de l'utilisateur
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur lors de la récupération des chats
 */
router.get('/:userId', authenticate, roleCheck(['Patient', 'Medecin']), userChats);

/**
 * @swagger
 * /chats/find/{firstId}/{secondId}:
 *   get:
 *     summary: Trouver un chat
 *     description: Trouve un chat entre deux utilisateurs.
 *     tags: [Chat]  # Ajout du tag ici
 *     parameters:
 *       - name: firstId
 *         in: path
 *         required: true
 *         description: ID du premier utilisateur
 *         schema:
 *           type: string
 *           example: '67b74745dea578a10872721e'
 *       - name: secondId
 *         in: path
 *         required: true
 *         description: ID du deuxième utilisateur
 *         schema:
 *           type: string
 *           example: '67b74756dea578a108727220'
 *     responses:
 *       200:
 *         description: Chat trouvé avec succès
 *       404:
 *         description: Chat non trouvé
 *       500:
 *         description: Erreur lors de la recherche du chat
 */
router.get('/find/:firstId/:secondId', authenticate, roleCheck(['Patient', 'Medecin']), findChat);

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Lister tous les chats
 *     description: Récupère une liste de tous les chats.
 *     tags: [Chat]  # Ajout du tag ici
 *     responses:
 *       200:
 *         description: Liste de tous les chats
 *       500:
 *         description: Erreur lors de la récupération des chats
 */
router.get('/', authenticate, roleCheck(['Patient', 'Medecin']), listChats);

export default router;
