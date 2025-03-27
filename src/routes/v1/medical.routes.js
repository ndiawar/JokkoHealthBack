import express from 'express';
import {
    getAllMedicalRecords,
    getMedicalRecordByUser,
    updateMedicalRecord,
    deleteMedicalRecord,
    getMedicalRecordsStatsByMonthForMedecin,
    getRecentMedicalRecords,
    getMedicalRecordByPatientId,
    getMedicalRecordById
    // getMedicalRecordByUser // Importez la nouvelle fonction
} from '../../controllers/medical/MedicalController.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import logAction from '../../middlewares/logs/logMiddleware.js';


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
 */
router.get('/', authenticate, logAction, getAllMedicalRecords);

/**
 * @swagger
 * /api/medical/me:
 *   get:
 *     tags: [Dossiers médicaux]
 *     summary: Récupérer le dossier médical de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Dossier médical récupéré avec succès
 *       404:
 *         description: Dossier médical non trouvé
 */
router.get('/me', authenticate, logAction, getMedicalRecordByUser);


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
router.put('/:recordId', authenticate, logAction, updateMedicalRecord);

/**
 * @swagger
 * /api/medical/{recordId}:
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
router.delete('/:recordId', authenticate, logAction, deleteMedicalRecord);


/**
* @swagger
* /api/medical/recent:
*   get:
*     tags: [Dossiers médicaux]
*     summary: Récupérer les dossiers médicaux récents
*     responses:
*       200:
*         description: Dossiers médicaux récents récupérés avec succès
*       500:
*         description: Erreur interne du serveur
*/
router.get('/recent', authenticate, getRecentMedicalRecords);

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
router.get('/:recordId', authenticate, logAction, getMedicalRecordById);


/**
* @swagger
* /api/medical/patient/{patientId}:
*   get:
*     tags: [Dossiers médicaux]
*     summary: Récupérer un dossier médical par patient ID
*     parameters:
*       - in: path
*         name: patientId
*         required: true
*         description: L'ID du patient dont le dossier médical doit être récupéré
*         schema:
*           type: string
*     responses:
*       200:
*         description: Dossier médical récupéré avec succès
*       404:
*         description: Dossier médical non trouvé
*/
router.get('/patient/:patientId', authenticate, logAction, getMedicalRecordByPatientId);

router.get('/medical-records/stats-by-month-for-medecin', authenticate, getMedicalRecordsStatsByMonthForMedecin);

export default router;