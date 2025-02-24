import express from 'express';
import {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord
} from '../../controllers/medical/MedicalController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MedicalRecords
 *   description: Opérations liées aux dossiers médicaux
 */

/**
 * @swagger
 * /api/medical:
 *   post:
 *     tags: [MedicalRecords]
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
router.post('/', createMedicalRecord);

/**
 * @swagger
 * /api/medical/{recordId}:
 *   get:
 *     tags: [MedicalRecords]
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
router.get('/:recordId', getMedicalRecordById);

/**
 * @swagger
 * /api/medical/{recordId}:
 *   put:
 *     tags: [MedicalRecords]
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
router.put('/:recordId', updateMedicalRecord);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   delete:
 *     summary: Supprimer un dossier médical
 *     description: Supprime un dossier médical à partir de son ID.
 *     tags:
 *       - Dossiers médicaux
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
 */
router.delete('/:recordId', deleteMedicalRecord);

export default router;
