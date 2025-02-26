import express from 'express';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import { createLog, getUserLogs, getAllLogs, deleteLog } from '../../controllers/historique/LogController.js'; // Bonnes importations

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
 *       500:
 *         description: Erreur serveur interne
 */
router.post('/logs',authenticate,  createLog);

/**
 * @swagger
 * /logs/user/{userId}:
 *   get:
 *     summary: Récupérer les logs d'un utilisateur
 *     description: Cette route permet de récupérer tous les logs associés à un utilisateur spécifique, en utilisant son ID.
 *     tags: [Gestion des Logs]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID de l'utilisateur dont on souhaite récupérer les logs
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: ID de l'utilisateur
 *                   action:
 *                     type: string
 *                     description: Action effectuée par l'utilisateur
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: Date et heure de l'action
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur interne
 */
router.get('/logs/user/:userId', authenticate, getUserLogs);

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Récupérer tous les logs
 *     description: Cette route permet de récupérer tous les logs de l'application (facultatif et nécessite des droits d'accès adéquats).
 *     tags: [Gestion des Logs]
 *     responses:
 *       200:
 *         description: Logs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: ID de l'utilisateur
 *                   action:
 *                     type: string
 *                     description: Action effectuée par l'utilisateur
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: Date et heure de l'action
 *       500:
 *         description: Erreur serveur interne
 */
router.get('/logs', authenticate, getAllLogs);

/**
 * @swagger
 * /logs/{id}:
 *   delete:
 *     summary: Supprimer un log
 *     description: Cette route permet de supprimer un log spécifique en utilisant son ID.
 *     tags: [Gestion des Logs]
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
 *       404:
 *         description: Log non trouvé
 *       500:
 *         description: Erreur serveur interne
 */
router.delete('/logs/:id', authenticate, deleteLog);

export default router;
