import express from 'express';
import { postSensorData, getAllSensorData } from '../../controllers/sensorPoul/sensorPoulController.js'; // Ajoutez l'extension .js

const router = express.Router();



// Route pour recevoir les données du capteur via HTTP POST (optionnel)
router.post('/', postSensorData); // Route pour POST
router.get('/', getAllSensorData); // Route pour GET

export default router;