// routes/medicalRecordRoutes.js
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
 * /api/medical-records:
 *   post:
 *     summary: Créer un dossier médical
 *     description: Crée un nouveau dossier médical avec les informations de l'utilisateur.
 *     tags:
 *       - Dossiers médicaux
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               telephone:
 *                 type: string
 *               poids:
 *                 type: number
 *               age:
 *                 type: number
 *               groupeSanguin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dossier médical créé avec succès
 */
router.post('/', createMedicalRecord);

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     summary: Récupérer tous les dossiers médicaux
 *     description: Récupère tous les dossiers médicaux enregistrés.
 *     tags:
 *       - Dossiers médicaux
 *     responses:
 *       200:
 *         description: Liste des dossiers médicaux
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *                   telephone:
 *                     type: string
 *                   poids:
 *                     type: number
 *                   age:
 *                     type: number
 *                   groupeSanguin:
 *                     type: string
 */
router.get('/', getAllMedicalRecords);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   get:
 *     summary: Récupérer un dossier médical par ID
 *     description: Récupère un dossier médical en utilisant son ID.
 *     tags:
 *       - Dossiers médicaux
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         description: L'ID du dossier médical à récupérer.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dossier médical trouvé
 *       404:
 *         description: Dossier médical non trouvé
 */
router.get('/:recordId', getMedicalRecordById);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   put:
 *     summary: Mettre à jour un dossier médical
 *     description: Met à jour un dossier médical avec les nouvelles informations.
 *     tags:
 *       - Dossiers médicaux
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         description: L'ID du dossier médical à mettre à jour.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               telephone:
 *                 type: string
 *               poids:
 *                 type: number
 *               age:
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
 *         description: L'ID du dossier médical à supprimer.
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
