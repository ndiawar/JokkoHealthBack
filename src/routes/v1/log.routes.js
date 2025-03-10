import express from 'express';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import { createLog, getUserLogs, getAllLogs, deleteLog } from '../../controllers/historique/LogController.js';
import roleCheck from '../../middlewares/auth/roleCheck.js'; // Middleware de vérification des rôles

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gestion des Logs
 *   description: API pour gérer les logs des utilisateurs
 */

/**
 * @swagger
 * /logs:
 *   post:
 *     summary: Créer un log
 *     description: Cette route permet de créer un log, utilisée généralement dans un middleware pour enregistrer les actions des utilisateurs.
 *     tags: [Gestion des Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur qui a effectué l'action
 *               action:
 *                 type: string
 *                 description: Action effectuée par l'utilisateur
 *               endpoint:
 *                 type: string
 *                 description: URL de l'endpoint
 *               method:
 *                 type: string
 *                 description: Méthode HTTP (GET, POST, PUT, DELETE)
 *               requestData:
 *                 type: object
 *                 description: Données envoyées dans la requête (facultatif)
 *     responses:
 *       201:
 *         description: Log créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur interne
 */
router.post('/log', authenticate, createLog);

/**
 * @swagger
 * /logs/user/{userId}:
 *   get:
 *     summary: Récupérer les logs d'un utilisateur
 *     description: Cette route permet de récupérer tous les logs associés à un utilisateur spécifique, en utilisant son ID.
 *     tags: [Gestion des Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID de l'utilisateur dont on souhaite récupérer les logs
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Numéro de la page (par défaut 1)
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Nombre d'éléments par page (par défaut 10)
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Logs de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         description: ID de l'utilisateur
 *                       action:
 *                         type: string
 *                         description: Action effectuée par l'utilisateur
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Date et heure de l'action
 *                 totalPages:
 *                   type: integer
 *                   description: Nombre total de pages
 *                 currentPage:
 *                   type: integer
 *                   description: Page actuelle
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur interne
 */
router.get('/logs/user/:userId', authenticate,  getUserLogs);

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Récupérer tous les logs
 *     description: Cette route permet de récupérer tous les logs de l'application (facultatif et nécessite des droits d'accès adéquats).
 *     tags: [Gestion des Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Numéro de la page (par défaut 1)
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Nombre d'éléments par page (par défaut 10)
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Logs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         description: ID de l'utilisateur
 *                       action:
 *                         type: string
 *                         description: Action effectuée par l'utilisateur
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Date et heure de l'action
 *                 totalPages:
 *                   type: integer
 *                   description: Nombre total de pages
 *                 currentPage:
 *                   type: integer
 *                   description: Page actuelle
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur interne
 */
router.get('/', getAllLogs);

/**
 * @swagger
 * /logs/{id}:
 *   delete:
 *     summary: Supprimer un log
 *     description: Cette route permet de supprimer un log spécifique en utilisant son ID.
 *     tags: [Gestion des Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID du log à supprimer
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Log non trouvé
 *       500:
 *         description: Erreur serveur interne
 */
router.delete('/logs/:id', authenticate, roleCheck(['SuperAdmin']), deleteLog);

export default router;