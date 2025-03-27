import express from 'express';
import { 
    assignSensorToUser,
    receiveSensorData,
    getLatestSensorData,
    getSensorDataByRecordId,
    getSensorDataForCurrentUser,
    getSensorDataForCurrentPatient
} from '../../controllers/sensorPoul/sensorPoulController.js'; // Assurez-vous que le chemin est correct
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();

// Route pour assigner un capteur à un utilisateur
router.post('/assignSensorToUser', authenticate, assignSensorToUser);

// Route pour recevoir et afficher les données sans les enregistrer
router.post('/sensorPoul', receiveSensorData); 

// Route pour obtenir les dernières données du capteur
router.get('/sensorPoul/latest', getLatestSensorData);

// Route pour obtenir les données du capteur pour le patient actuel
router.get('/sensorPoul/currentPatientSensorData', authenticate, getSensorDataForCurrentPatient);

// Route pour obtenir les données du capteur par ID du dossier médical
router.get('/sensorPoul/:recordId', getSensorDataByRecordId);

// Route pour récupérer les données du capteur pour l'utilisateur connecté
router.get('/sensorPoul/currentUserSensorData', authenticate, getSensorDataForCurrentUser);

export default router;
