// src/routes/v1/rendezvous.route.js

import express from 'express';
import { getAppointments, getAllAppointments, getAcceptedAppointmentsForPatient, getAcceptedAppointmentRequests, getPendingAppointmentRequests, createRendezVous, getAvailableAppointments, requestAppointment, handleAppointmentRequest } from '../../controllers/appointment/rendezVousController.js';  // Make sure the controller path is correct
import { authenticate } from '../../middlewares/auth/authenticate.js';

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
router.post('/create', authenticate, createRendezVous);  // Add authentication middleware if necessary

router.get('/patient/available', authenticate, getAvailableAppointments); // Nouvelle route

router.put('/patient/:appointmentId/demande', authenticate, requestAppointment); // Nouvelle route

router.put('/medecin/:appointmentId/reponse', authenticate, handleAppointmentRequest); // Nouvelle route

router.get('/', authenticate, getAppointments); // Nouvelle route

// Ajouter la nouvelle route dans ton router
router.get('/pending-requests', authenticate, getPendingAppointmentRequests);

router.get('/accepted-participation', authenticate, getAcceptedAppointmentRequests);

router.get('/accepted-for-patient', authenticate, getAcceptedAppointmentsForPatient);
router.get('/tous', authenticate, getAllAppointments);

export default router;
