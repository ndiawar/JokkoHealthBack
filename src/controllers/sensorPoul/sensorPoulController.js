import SensorPoul from '../../models/SensorPoul/SensorPoulModel.js'; // Utilisez la casse correcte
import mongoose from 'mongoose';

// 🔔 Ajouter des données de capteur
export const postSensorData = async (req, res) => {
    try {
        const { userId, heartRate, oxygenLevel } = req.body;

        // Vérification que l'ID est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'ID utilisateur invalide.' });
        }

        // Vérification des données
        if (heartRate === undefined || oxygenLevel === undefined) {
            return res.status(400).json({ error: "Données invalides" });
        }

        // Création d'une nouvelle entrée dans la base de données
        const newSensorPoul = new SensorPoul({ userId, heartRate, oxygenLevel });
        await newSensorPoul.save();

        res.status(201).json(newSensorPoul);
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des données :", error);
        res.status(500).json({ error: "Erreur lors de l'enregistrement des données" });
    }
};

// 📩 Récupérer toutes les données de capteur
export const getAllSensorData = async (req, res) => {
    try {
        const data = await SensorPoul.find().sort({ timestamp: -1 }); // Récupérer toutes les données de capteur
        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
};