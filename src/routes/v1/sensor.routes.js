import express from 'express';
import { createSensorNotification } from '../../controllers/sensor/sensorController.js';

const router = express.Router();

/**
 * @swagger
 * /api/sensor-data:
 *   post:
 *     summary: Recevoir les données du capteur et créer une notification
 *     description: Reçoit les données du capteur et crée une notification pour l'utilisateur concerné.
 *     tags: 
 *       - Capteur
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
 *     responses:
 *       200:
 *         description: Notification créée avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', createSensorNotification);

export default router;