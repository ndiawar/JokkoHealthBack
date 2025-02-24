import express from 'express';
import { getUserLogs } from '../../controllers/historique/LogController.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';

/**
 * @swagger
 * swagger: '2.0'
 * info:
 *   title: API Logs
 *   description: API pour récupérer les logs des utilisateurs
 *   version: 1.0.0
 * paths:
 *   /logs:
 *     get:
 *       summary: Récupérer les logs d'un utilisateur
 *       description: Cette route récupère les logs des utilisateurs. L'accès est sécurisé et nécessite une authentification.
 *       operationId: getUserLogs
 *       tags:
 *         - Logs
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Logs récupérés avec succès
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: ID de l'utilisateur
 *                 action:
 *                   type: string
 *                   description: Action effectuée par l'utilisateur
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Date et heure de l'action
 *         '401':
 *           description: Non autorisé, l'authentification est requise
 *         '500':
 *           description: Erreur serveur interne
 * securityDefinitions:
 *   bearerAuth:
 *     type: apiKey
 *     in: header
 *     name: Authorization
 */

const router = express.Router();
router.get('/logs', authenticate, getUserLogs);

export default router;
