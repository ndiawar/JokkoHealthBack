import express from 'express';
import { addMessage, getMessages } from '../../controllers/chats/MessageController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Gestion des messages du chat
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Ajouter un message
 *     description: Ajouter un nouveau message dans le chat
 *     tags: [Messages]  # Ajout du tag ici
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
 *               text:
 *                 type: string
 *                 example: 'Bonjour, comment ça va ?'
 *               chatId:
 *                 type: string
 *                 example: '67b87ccd852422ff79dfaf32'
 *     responses:
 *       200:
 *         description: Message ajouté avec succès
 *       500:
 *         description: Erreur lors de l'ajout du message
 */
router.post('/', addMessage);

/**
 * @swagger
 * /messages/{chatId}:
 *   get:
 *     summary: Récupérer les messages d'un chat
 *     description: Récupérer tous les messages associés à un chat spécifique
 *     tags: [Messages]  # Ajout du tag ici
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: ID du chat pour lequel récupérer les messages
 *         schema:
 *           type: string
 *           example: '67b87ccd852422ff79dfaf32'
 *     responses:
 *       200:
 *         description: Liste des messages
 *       404:
 *         description: Chat non trouvé
 *       500:
 *         description: Erreur lors de la récupération des messages
 */
router.get('/:chatId', getMessages);

export default router;
