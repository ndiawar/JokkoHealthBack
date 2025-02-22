import express from 'express';
import { getUserNotifications, createNotification, markAsRead, disableNotification } from '../../controllers/notification/NotificationController.js'; 
const router = express.Router();

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Récupérer les notifications d'un utilisateur
 *     description: Récupère toutes les notifications d'un utilisateur donné.
 *     tags: 
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: L'ID de l'utilisateur.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notifications de l'utilisateur
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:userId', getUserNotifications); 

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Marquer une notification comme lue
 *     description: Change l'état de la notification pour la marquer comme lue.
 *     tags: 
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         description: L'ID de la notification à marquer comme lue.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       404:
 *         description: Notification non trouvée
 */
router.put('/:notificationId/read', markAsRead); 

/**
 * @swagger
 * /api/notifications/{notificationId}/disable:
 *   put:
 *     summary: Désactiver une notification
 *     description: Désactive une notification donnée.
 *     tags: 
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         description: L'ID de la notification à désactiver.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification désactivée avec succès
 *       404:
 *         description: Notification non trouvée
 */
router.put('/:notificationId/disable', disableNotification); 

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Créer une nouvelle notification
 *     description: Crée une notification pour un utilisateur spécifique.
 *     tags: 
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, error]
 *     responses:
 *       201:
 *         description: Notification créée avec succès
 */
router.post('/', createNotification); 

export default router;
