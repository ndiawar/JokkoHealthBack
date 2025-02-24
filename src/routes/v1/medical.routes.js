import express from 'express';
import {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord
} from '../../controllers/medical/MedicalController.js';
import logMiddleware from '../../middlewares/logs/logMiddleware.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dossiers médicaux
 *   description: Opérations liées aux dossiers médicaux
 */

/**
 * @swagger
 * /api/medical:
 *   post:
 *     tags: [Dossiers médicaux]
 *     summary: Créer un nouveau dossier médical
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               age:
 *                 type: number
 *               poids:
 *                 type: number
 *               groupeSanguin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dossier médical créé avec succès
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticate, logMiddleware, createMedicalRecord);

/**
 * @swagger
 * /api/medical/{recordId}:
 *   get:
 *     tags: [Dossiers médicaux]
 *     summary: Récupérer un dossier médical par ID
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         description: L'ID du dossier médical à récupérer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dossier médical récupéré avec succès
 *       404:
 *         description: Dossier médical non trouvé
 */
router.get('/:recordId', authenticate, logMiddleware, getMedicalRecordById);

/**
 * @swagger
 * /api/medical/{recordId}:
 *   put:
 *     tags: [Dossiers médicaux]
 *     summary: Mettre à jour un dossier médical
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         description: L'ID du dossier médical à mettre à jour
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: number
 *               poids:
 *                 type: number
 *               groupeSanguin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dossier médical mis à jour avec succès
 *       404:
 *         description: Dossier médical non trouvé
 */
router.put('/:recordId', authenticate, logMiddleware, updateMedicalRecord);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   delete:
 *     tags: [Dossiers médicaux]
 *     summary: Supprimer un dossier médical
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         description: L'ID du dossier médical à supprimer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dossier médical supprimé avec succès
 *       404:
 *         description: Dossier médical non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:recordId', authenticate, logMiddleware, deleteMedicalRecord);

export default router;
