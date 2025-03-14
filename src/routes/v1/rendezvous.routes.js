// src/routes/v1/rendezvous.route.js

import express from 'express';
import { 
        getAppointments, 
        getAllAppointments, 
        getAcceptedAppointmentsForPatient, 
        getAcceptedAppointmentRequests, 
        getPendingAppointmentRequests, 
        createRendezVous, 
        getAvailableAppointments, 
        requestAppointment, 
        handleAppointmentRequest,
        getAppointmentsStatsByMonthForMedecin
    } from '../../controllers/appointment/rendezVousController.js';  // Make sure the controller path is correct
import { authenticate } from '../../middlewares/auth/authenticate.js';
import logAction from '../../middlewares/logs/logMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *      name: Rendez-vous
 *      description: Rendez-vous API for appointments
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
 *           description: Heure début du rendez-vous
 *         heure_fin:
 *           type: string
 *           description: Heure de fin du rendez-vous
 *         specialiste:
 *           type: string
 *           description: Spécifique du rendez-vous
 *     Participation:
 *       type: object
 *       properties:
 *         patientId:
 *           type: string
 *           description: ID of the patient
 */

// Endpoint to create a rendezvous
router.post('/create', logAction, authenticate, createRendezVous);  // Add authentication middleware if necessary

router.get('/patient/available', logAction, authenticate, getAvailableAppointments); // Nouvelle route

router.put('/patient/:appointmentId/demande', logAction, authenticate, requestAppointment); // Nouvelle route

router.put('/medecin/:appointmentId/reponse', logAction, authenticate, handleAppointmentRequest); // Nouvelle route

router.get('/', logAction, authenticate, getAppointments); // Nouvelle route

// Ajouter la nouvelle route dans ton router
router.get('/pending-requests', logAction, authenticate, getPendingAppointmentRequests);

router.get('/accepted-participation', logAction, authenticate, getAcceptedAppointmentRequests);

router.get('/accepted-for-patient', logAction, authenticate, getAcceptedAppointmentsForPatient);

router.get('/tous', logAction, authenticate, getAllAppointments);
/**
 * @swagger
 * /appointments/stats/month:
 *   get:
 *     summary: Récupérer les statistiques des rendez-vous par mois pour le médecin connecté
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des rendez-vous par mois
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                       month:
 *                         type: integer
 *                       count:
 *                         type: integer
 *       403:
 *         description: Accès refusé - Seuls les médecins peuvent accéder à ces statistiques
 *       404:
 *         description: Aucune statistique trouvée pour ce médecin
 *       500:
 *         description: Erreur lors de la récupération des statistiques
 */
router.get('/stats/month', logAction, authenticate, getAppointmentsStatsByMonthForMedecin); // Nouvelle route pour les statistiques par mois


export default router;
