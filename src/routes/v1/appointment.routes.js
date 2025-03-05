import express from 'express';
import AppointmentController from '../../controllers/appointment/appointementController.js';
import roleCheck from '../../middlewares/auth/roleCheck.js';
import { body } from 'express-validator';
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rendez-vous
 *   description: API pour gérer les rendez-vous.
 */

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Créer un rendez-vous
 *     description: Cet endpoint permet de créer un rendez-vous sans `patientId`.
 *     tags: [Rendez-vous]
 *     requestBody:
 *       description: Données pour créer un rendez-vous.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               heure_debut:
 *                 type: string
 *               heure_fin:
 *                 type: string
 *               specialiste:
 *                 type: string
 *                 enum: [Cardiologue, Généraliste, Pneumologue]
 *     responses:
 *       201:
 *         description: Rendez-vous créé avec succès.
 *       400:
 *         description: Entrée invalide.
 */
const appointmentValidation = [
    body('date').isISO8601().toDate(),
    body('heure_debut').isString(),
    body('heure_fin').isString(),
    body('specialiste').isIn(['Cardiologue', 'Généraliste', 'Pneumologue']),
];

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Obtenir une liste des rendez-vous
 *     description: Cet endpoint retourne la liste de tous les rendez-vous.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des rendez-vous.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   date:
 *                     type: string
 *                   heure_debut:
 *                     type: string
 *                   heure_fin:
 *                     type: string
 *                   specialiste:
 *                     type: string
 */
router.post('/',authenticate, appointmentValidation, AppointmentController.create);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les chats
 *     description: Retourne la liste complète des chats enregistrés dans la base de données.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des chats récupérée avec succès.
 *       500:
 *         description: Erreur interne du serveur.
 */
router.get('/',authenticate,  AppointmentController.list);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Obtenir un rendez-vous par ID
 *     description: Cet endpoint permet de récupérer un rendez-vous par son ID.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du rendez-vous à récupérer.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du rendez-vous.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 date:
 *                   type: string
 *                 heure_debut:
 *                   type: string
 *                 heure_fin:
 *                   type: string
 *                 specialiste:
 *                   type: string
 *       404:
 *         description: Rendez-vous non trouvé.
 */
router.get('/:id',authenticate, AppointmentController.read);

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Mettre à jour un rendez-vous
 *     description: Cet endpoint permet de mettre à jour un rendez-vous existant par son ID.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du rendez-vous à mettre à jour.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Données pour mettre à jour le rendez-vous.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               heure_debut:
 *                 type: string
 *               heure_fin:
 *                 type: string
 *               specialiste:
 *                 type: string
 *                 enum: [Cardiologue, Généraliste, Pneumologue]
 *     responses:
 *       200:
 *         description: Rendez-vous mis à jour avec succès.
 *       400:
 *         description: Entrée invalide.
 *       404:
 *         description: Rendez-vous non trouvé.
 */
router.put('/:id',authenticate, roleCheck(['Patient', 'Medecin']), appointmentValidation, AppointmentController.update);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Supprimer un rendez-vous
 *     description: Cet endpoint permet de supprimer un rendez-vous par son ID.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du rendez-vous à supprimer.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rendez-vous supprimé avec succès.
 *       404:
 *         description: Rendez-vous non trouvé.
 */
router.delete('/:id',authenticate, roleCheck(['Patient', 'Medecin']), AppointmentController.delete);

/**
 * @swagger
 * /appointments/{id}/demander-participation:
 *   post:
 *     summary: Demander à participer à un rendez-vous
 *     description: Cet endpoint permet à un patient de demander à participer à un rendez-vous.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du rendez-vous auquel participer.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Données pour demander la participation.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Demande de participation réussie.
 *       400:
 *         description: Entrée invalide ou `patientId` incorrect.
 *       404:
 *         description: Rendez-vous non trouvé.
 */
const participationValidation = [
    body('patientId').notEmpty().isMongoId(),
];

router.post('/:id/demander-participation',authenticate,roleCheck(['Patient', 'Medecin']), participationValidation, AppointmentController.demanderParticipation);

/**
 * @swagger
 * /appointments/{id}/statu-demande:
 *   put:
 *     summary: Mettre à jour le statut de la demande de participation
 *     description: Cet endpoint permet de mettre à jour le statut d'une demande de participation à un rendez-vous.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du rendez-vous pour lequel mettre à jour la demande.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès.
 *       400:
 *         description: Entrée invalide.
 *       404:
 *         description: Rendez-vous non trouvé.
 */
router.put('/:id/statu-demande',authenticate, roleCheck(['Patient', 'Medecin']), AppointmentController.gestionDemande);
/**
 * @swagger
 * /appointments/demandes-participation:
 *   get:
 *     summary: Lister les demandes de participation
 *     description: Cet endpoint retourne la liste des demandes de participation aux rendez-vous.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des demandes de participation.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   date:
 *                     type: string
 *                   heure_debut:
 *                     type: string
 *                   heure_fin:
 *                     type: string
 *                   patient:
 *                     type: object
 *                     properties:
 *                       nom:
 *                         type: string
 *                       prenom:
 *                         type: string
 *       404:
 *         description: Aucune demande de participation trouvée.
 */

export default router;
