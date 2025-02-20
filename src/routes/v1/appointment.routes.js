import express from 'express';
import AppointmentController from '../../controllers/appointment/appointementController.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation des données de rendez-vous pour la création (sans patientId)
const appointmentValidation = [
    body('date').isISO8601().toDate(),
    body('heure_debut').isString(),
    body('heure_fin').isString(),
    body('specialiste').isIn(['Cardiologue', 'Généraliste', 'Pneumologue']),
];

// Validation des données pour demander la participation (avec patientId)
const participationValidation = [
    body('patientId').notEmpty().isMongoId(),  // Validation de patientId uniquement dans cette route
];

// Routes CRUD
router.post('/', appointmentValidation, AppointmentController.create);
router.get('/', AppointmentController.list);
router.get('/:id', AppointmentController.read);
router.put('/:id', appointmentValidation, AppointmentController.update);
router.delete('/:id', AppointmentController.delete);

// Routes pour gérer les demandes de participation
router.post('/:id/demander-participation', participationValidation, AppointmentController.demanderParticipation);
router.put('/:id/statu-demande', AppointmentController.gestionDemande);

export default router;
