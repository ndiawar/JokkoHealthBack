import express from 'express';
import { 
    assignSensorToUser, 
    getAllSensorData, 
    deleteSensor, 
    receiveSensorDataForUser, 
    receiveSensorData,
    getLatestSensorData
} from '../../controllers/sensorPoul/sensorPoulController.js'; // Assurez-vous que le chemin est correct

const router = express.Router();

// Route pour assigner un capteur à un utilisateur
router.post('/assignSensorToUser', assignSensorToUser);

// Route pour récupérer toutes les données du capteur pour un utilisateur spécifique
router.get('/sensorData', getAllSensorData);  // Peut être filtré par utilisateur avec query parameters

// Route pour supprimer un capteur
router.delete('/deleteSensor/:id', deleteSensor);

// Route pour enregistrer des données du capteur pour un utilisateur spécifique
router.post('/receiveSensorDataForUser', receiveSensorDataForUser);

// Route pour recevoir et afficher les données sans les enregistrer
router.post('/sensorPoul', receiveSensorData);  // Comme tu l'avais déjà fait, mais c'est aussi une route POST
router.get('/sensorPoul/latest', getLatestSensorData);

export default router;
