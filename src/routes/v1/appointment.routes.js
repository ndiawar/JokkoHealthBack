import express from 'express';
import AppointmentController from '../../controllers/appointment/appointementController.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: API for managing appointments.
 */

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create an appointment
 *     description: This endpoint allows you to create an appointment without patientId.
 *     tags: [Appointments]
 *     requestBody:
 *       description: Data to create an appointment.
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
 *         description: Appointment created successfully.
 *       400:
 *         description: Invalid input.
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
 *     summary: Get a list of appointments
 *     description: This endpoint returns a list of all appointments.
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: A list of appointments.
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
router.post('/', appointmentValidation, AppointmentController.create);
router.get('/', AppointmentController.list);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get an appointment by ID
 *     description: This endpoint allows you to retrieve an appointment by its ID.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the appointment to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details.
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
 *         description: Appointment not found.
 */
router.get('/:id', AppointmentController.read);

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update an appointment
 *     description: This endpoint allows you to update an existing appointment by its ID.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the appointment to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Data to update the appointment.
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
 *         description: Appointment updated successfully.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Appointment not found.
 */
router.put('/:id', appointmentValidation, AppointmentController.update);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     description: This endpoint allows you to delete an appointment by its ID.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the appointment to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment deleted successfully.
 *       404:
 *         description: Appointment not found.
 */
router.delete('/:id', AppointmentController.delete);

/**
 * @swagger
 * /appointments/{id}/demander-participation:
 *   post:
 *     summary: Request participation in an appointment
 *     description: This endpoint allows a patient to request participation in an appointment.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the appointment to request participation in.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Data to request participation.
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
 *         description: Participation request successful.
 *       400:
 *         description: Invalid input or patientId.
 *       404:
 *         description: Appointment not found.
 */
const participationValidation = [
    body('patientId').notEmpty().isMongoId(),
];

router.post('/:id/demander-participation', participationValidation, AppointmentController.demanderParticipation);

/**
 * @swagger
 * /appointments/{id}/statu-demande:
 *   put:
 *     summary: Update participation request status
 *     description: This endpoint allows updating the status of a participation request for an appointment.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the appointment to update the participation request for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated successfully.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Appointment not found.
 */
router.put('/:id/statu-demande', AppointmentController.gestionDemande);

export default router;
