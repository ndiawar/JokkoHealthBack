import express from 'express';
import {
    getAllMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord
} from '../../controllers/medical/MedicalController.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import logMiddleware from '../../middlewares/logs/logMiddleware.js';


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
 *   get:
 *     tags: [Dossiers médicaux]
 *     summary: Récupérer tous les dossiers médicaux
 *     responses:
 *       200:
 *         description: Liste des dossiers médicaux récupérés avec succès
 *       500:
 *         description: Erreur interne du serveur
 * description: Récupérer tous les dossiers médicaux
 */
router.get('/', authenticate, logMiddleware, getAllMedicalRecords);
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
router.get('/:recordId', authenticate,logMiddleware, getMedicalRecordById);

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
router.put('/:recordId',authenticate, logMiddleware, updateMedicalRecord);

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
router.delete('/:recordId',authenticate, logMiddleware, deleteMedicalRecord);

export default router;
