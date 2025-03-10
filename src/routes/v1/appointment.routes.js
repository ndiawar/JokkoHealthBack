import express from 'express';
import AppointmentController from '../../controllers/appointment/appointementController.js';
import roleCheck from '../../middlewares/auth/roleCheck.js';
import { body, param } from 'express-validator';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import { validateObjectId } from '../../middlewares/validation/validateObjectId.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rendez-vous
 *   description: Gestion des rendez-vous
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date du rendez-vous
 *         heure_debut:
 *           type: string
 *           description: Heure de début du rendez-vous
 *         heure_fin:
 *           type: string
 *           description: Heure de fin du rendez-vous
 *         specialiste:
 *           type: string
 *           description: Spécialité du rendez-vous
 *     Participation:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *           description: ID du patient
 */

const appointmentValidation = [
    body('date').isISO8601().withMessage('Date invalide'),
    body('heure_debut').isString().withMessage('L\'heure de début doit être une chaîne valide'),
    body('heure_fin').isString().withMessage('L\'heure de fin doit être une chaîne valide'),
    body('specialiste').isString().withMessage('Le spécialité doit être spécifiée')
];

const participationValidation = [
    body('patientId').notEmpty().isMongoId()
];

/**
 * @swagger
 * /appointments/create:
 *   post:
 *     summary: Créer un rendez-vous
 *     description: Crée un nouveau rendez-vous pour un patient.
 *     tags: [Rendez-vous]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Rendez-vous créé avec succès
 *       400:
 *         description: Entrée invalide
 *       403:
 *         description: Seul un médecin peut créer un rendez-vous
 *       500:
 *         description: Erreur lors de la création du rendez-vous
 */
router.post('/create', authenticate, appointmentValidation, AppointmentController.create);

/**
 * @swagger
 * /appointments/historique-patient:
 *   get:
 *     summary: Historique des rendez-vous d'un patient
 *     description: Récupère l'historique des rendez-vous d'un patient.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Historique des rendez-vous récupéré avec succès
 *       500:
 *         description: Erreur lors de la récupération de l'historique des rendez-vous
 */
router.get('/historique-patient', authenticate, AppointmentController.getHistoriquePatient);

/**
 * @swagger
 * /appointments/historique-medecin:
 *   get:
 *     summary: Historique des rendez-vous d'un médecin
 *     description: Récupère l'historique des rendez-vous d'un médecin.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Historique des rendez-vous récupéré avec succès
 *       500:
 *         description: Erreur lors de la récupération de l'historique des rendez-vous
 */
router.get('/historique-medecin', authenticate, AppointmentController.getHistoriqueMedecin);

/**
 * @swagger
 * /appointments/{id}/demander-participation:
 *   post:
 *     summary: Demander la participation à un rendez-vous
 *     description: Permet à un patient de demander à participer à un rendez-vous.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Participation'
 *     responses:
 *       200:
 *         description: Demande de participation envoyée avec succès
 *       400:
 *         description: Entrée invalide
 *       403:
 *         description: Seul un patient peut demander à participer à un rendez-vous
 *       404:
 *         description: Rendez-vous non trouvé
 *       500:
 *         description: Erreur lors de la demande de participation
 */
router.post('/:id/demander-participation', authenticate, participationValidation, AppointmentController.demanderParticipation);

/**
 * @swagger
 * /appointments/{id}/gestion-demande:
 *   patch:
 *     summary: Gérer l'acceptation ou le rejet de la demande
 *     description: Permet à un médecin de gérer l'acceptation ou le rejet de la demande de participation à un rendez-vous.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statutDemande:
 *                 type: string
 *                 enum: [accepté, rejeté]
 *     responses:
 *       200:
 *         description: Demande gérée avec succès
 *       400:
 *         description: Entrée invalide
 *       403:
 *         description: Seul le médecin ayant créé ce rendez-vous peut accepter ou rejeter la demande
 *       404:
 *         description: Rendez-vous non trouvé
 *       500:
 *         description: Erreur lors de la gestion de la demande
 */
router.patch('/:id/gestion-demande', authenticate, AppointmentController.gestionDemande);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Liste totale des rendez-vous
 *     description: Récupère la liste totale des rendez-vous.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des rendez-vous récupérée avec succès
 *       500:
 *         description: Erreur lors de la récupération de la liste des rendez-vous
 */
router.get('/', authenticate, AppointmentController.list);

/**
 * @swagger
 * /appointments/accepted:
 *   get:
 *     summary: Liste des rendez-vous acceptés
 *     description: Récupère la liste des rendez-vous acceptés.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des rendez-vous acceptés récupérée avec succès
 *       500:
 *         description: Erreur lors de la récupération de la liste des rendez-vous acceptés
 */
router.get('/accepted', authenticate, AppointmentController.listAccepted);

/**
 * @swagger
 * /appointments/rejected:
 *   get:
 *     summary: Liste des rendez-vous refusés
 *     description: Récupère la liste des rendez-vous refusés.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des rendez-vous refusés récupérée avec succès
 *       500:
 *         description: Erreur lors de la récupération de la liste des rendez-vous refusés
 */
router.get('/rejected', authenticate, AppointmentController.listRejected);

/**
 * @swagger
 * /appointments/requests:
 *   get:
 *     summary: Liste des demandes de participation
 *     description: Récupère toutes les demandes de participation pour les rendez-vous d'un médecin
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes récupérée avec succès
 *       403:
 *         description: Accès non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/requests', authenticate, AppointmentController.listParticipationRequests);

/**
 * @param {string}
 * @swagger
 * /appointments/accepted-today:
 *   get:
 *     summary: Rendez-vous acceptés aujourd'hui
 *     description: Récupère les rendez-vous acceptés aujourd'hui pour les rendez-vous d'un médecin
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rendez-vous acceptés aujourd'hui récupérée avec succès
 *       403:
 *         description: Ce patient n'est pas lié à un médecin
 *       500:
 *         description: Erreur lors de la récupération des rendez-vous acceptés aujourd'hui du patient
 */
router.get('/accepted-today', authenticate, AppointmentController.listAcceptedAppointmentsToday);

/**
 * @swagger
 * /appointments/by-doctor:
 *   get:
 *     summary: Rendez-vous créés par le médecin du patient
 *     description: Récupère les rendez-vous créés par le médecin du patient connecté.
 *     tags: [Rendez-vous]
 *     responses:
 *       200:
 *         description: Liste des rendez-vous récupérée avec succès
 *       403:
 *         description: Ce patient n'est pas lié à un médecin
 *       500:
 *         description: Erreur lors de la récupération des rendez-vous du médecin
 */
router.get('/by-doctor', authenticate, AppointmentController.getAppointmentsByDoctor);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Lire un rendez-vous
 *     description: Récupère un rendez-vous spécifique par son ID.
 *     tags: [Rendez-vous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous à récupérer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rendez-vous récupéré avec succès
 *       404:
 *         description: Rendez-vous non trouvé
 *       500:
 *         description: Erreur lors de la récupération du rendez-vous
 */
router.get('/:id', authenticate, validateObjectId, AppointmentController.read); // Ajout d'une validation d'ID
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



router.get('/calendar', AppointmentController.getAppointmentsForCalendar);

export default router;