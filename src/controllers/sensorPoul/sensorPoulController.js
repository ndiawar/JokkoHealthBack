import mongoose from 'mongoose';
import Sensor from '../../models/sensor/sensorModel.js';
import User from '../../models/user/userModel.js'; // Assurez-vous d'importer le modèle User
import { v4 as uuidv4 } from 'uuid'; // Importer uuid pour générer un sensorId unique
import MedicalRecord from '../../models/medical/medicalModel.js'; // Importer le modèle MedicalRecord

export const assignSensorToUser = async (req, res) => {
  try {
    const { macAddress, recordId } = req.body; // Utiliser recordId au lieu de userId

    console.log("Données reçues :", { macAddress, recordId }); // Log des données reçues

    // Vérifier que les données nécessaires sont présentes
    if (!macAddress || !recordId) {
      console.log("Données manquantes :", { macAddress, recordId }); // Log des données manquantes
      return res.status(400).json({ message: "Adresse MAC et ID du dossier médical nécessaires" });
    }

    // Vérifier que recordId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      console.log("ID du dossier médical invalide :", recordId); // Log de l'ID invalide
      return res.status(400).json({ message: "ID du dossier médical invalide" });
    }

    // Récupérer le dossier médical
    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
      console.log("Dossier médical non trouvé :", recordId); // Log du dossier médical non trouvé
      return res.status(404).json({ message: "Dossier médical non trouvé" });
    }

    // Récupérer l'ID de l'utilisateur (patient) à partir du dossier médical
    const userId = medicalRecord.patientId;
    if (!userId) {
      console.log("ID de l'utilisateur non trouvé dans le dossier médical :", medicalRecord); // Log de l'ID manquant
      return res.status(404).json({ message: "ID de l'utilisateur non trouvé dans le dossier médical" });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      console.log("Utilisateur non trouvé :", userId); // Log de l'utilisateur non trouvé
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le capteur existe déjà et est assigné à un autre utilisateur
    const existingSensor = await Sensor.findOne({ mac: macAddress });
    if (existingSensor && existingSensor.user) {
      console.log("Capteur déjà assigné :", macAddress); // Log du capteur déjà assigné
      return res.status(400).json({ message: "Ce capteur est déjà assigné à un utilisateur" });
    }

    // Si le capteur n'est pas encore assigné, on peut l'assigner à l'utilisateur
    const newSensor = new Sensor({
      mac: macAddress,
      user: userId, // Utiliser l'ID de l'utilisateur récupéré
      heartRate: 0, // Valeur par défaut
      spo2: 0, // Valeur par défaut
      anomalies: [],
      status: 'Active',
      sensorId: uuidv4(), // Générer un sensorId unique
    });

    // Enregistrer le capteur
    await newSensor.save();

    console.log("Capteur assigné avec succès :", newSensor); // Log du capteur assigné

    // Répondre au client
    res.status(200).json({
      message: "Capteur assigné à l'utilisateur avec succès",
      sensor: newSensor,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'assignation du capteur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//Méthode pour détecter les anomalies dans les données du capteur
const detectAnomalies = (heartRate, oxygenLevel) => {
    let anomalies = [];

    // Anomalies de fréquence cardiaque
    if (heartRate < 50) {
        anomalies.push("Bradycardie détectée! Fréquence cardiaque trop basse.");
    } else if (heartRate > 100) {
        anomalies.push("Tachycardie détectée! Fréquence cardiaque trop élevée.");
    }

    // Anomalies de saturation en oxygène
    if (oxygenLevel < 90) {
        anomalies.push("Hypoxémie détectée! SpO2 trop bas.");
    }
    if (oxygenLevel < 85) {
        anomalies.push("Danger critique! SpO2 trop bas.");
    }

    return anomalies;
};

// Méthode pour récupérer toutes les données de capteur pour un utilisateur spécifique
export const getAllSensorData = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query; // Récupérer l'ID utilisateur et les dates

        let query = {};
        if (userId) {
            query.user = userId; // Filtrer par utilisateur
        }

        if (startDate && endDate) {
            query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) }; // Filtrer par plage de dates
        }

        const data = await Sensor.find(query).sort({ timestamp: -1 }); // Récupérer les données filtrées
        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};


// Méthode pour supprimer un capteur
export const deleteSensor = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const sensor = await Sensor.findById(sensorId);
        if (!sensor) {
            return res.status(404).json({ message: "Capteur non trouvé" });
        }

        // Dissocier le capteur de l'utilisateur
        const userId = sensor.user;
        const user = await User.findById(userId);
        if (user) {
            // Suppression du capteur de la liste des capteurs de l'utilisateur
            user.sensors = user.sensors.filter(s => s.toString() !== sensorId);
            await user.save();
        }

        await sensor.remove();
        res.status(204).send();
        console.log(`Capteur ${sensorId} supprimé avec succès`);
    } catch (error) {
        console.error("Erreur lors de la suppression du capteur :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};


// Méthode pour l'enregistrement des données du capteur pour un utilisateur spécifique
export const receiveSensorDataForUser = async (req, res) => {
    try {
        const { heartRate, oxygenLevel, macAddress, timestamp, userId } = req.body;

        // Vérifier que toutes les données nécessaires sont présentes
        if (!heartRate || !oxygenLevel || !macAddress || !timestamp || !userId) {
            return res.status(400).json({ message: "Données manquantes" });
        }

        // Vérifier que les valeurs sont des nombres valides
        if (isNaN(heartRate) || isNaN(oxygenLevel)) {
            return res.status(400).json({ message: "Fréquence cardiaque et SpO2 doivent être des valeurs numériques valides" });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si le capteur existe et est assigné à cet utilisateur
        const sensor = await Sensor.findOne({ mac: macAddress, user: userId });
        if (!sensor) {
            return res.status(400).json({ message: "Ce capteur n'est pas assigné à cet utilisateur" });
        }

        // Détecter les anomalies
        const anomalies = detectAnomalies(heartRate, oxygenLevel);

        // Mettre à jour les données du capteur
        sensor.heartRate = heartRate;
        sensor.spo2 = oxygenLevel;
        sensor.timestamp = new Date(timestamp);
        sensor.anomalies = anomalies;

        // Sauvegarder les données du capteur mises à jour
        await sensor.save();

        // Répondre au client
        res.status(200).json({
            message: "Données du capteur mises à jour avec succès",
            sensorData: sensor
        });
    } catch (error) {
        console.error("❌ Erreur lors de la réception des données du capteur :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};


// Variable globale pour stocker les données reçues
let latestSensorData = null;

export const receiveSensorData = async (req, res) => {
    try {
        const { heartRate, oxygenLevel, macAddress, timestamp } = req.body;

        // Vérifier que toutes les données sont bien reçues
        if (!heartRate || !oxygenLevel || !macAddress || !timestamp) {
            return res.status(400).json({ message: "Données manquantes" });
        }

        // Stocker les données reçues dans la variable globale
        latestSensorData = { heartRate, oxygenLevel, macAddress, timestamp };

        // Affichage des données dans la console du serveur
        console.log("🔹 Données reçues depuis ESP8266 :");
        console.log(`💓 Fréquence cardiaque : ${heartRate} BPM`);
        console.log(`🩸 Saturation O2 : ${oxygenLevel}%`);
        console.log(`📡 Adresse MAC : ${macAddress}`);
        console.log(`🕰️ Heure des données : ${timestamp}`);

        // Répondre au client (ESP8266)
        res.status(200).json({
            message: "Données reçues avec succès",
            data: { heartRate, oxygenLevel, macAddress, timestamp }
        });

    } catch (error) {
        console.error("❌ Erreur lors de la réception des données :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Endpoint pour récupérer les dernières données
export const getLatestSensorData = async (req, res) => {
    try {
      if (!latestSensorData) {
        return res.status(404).json({ message: "Aucune donnée disponible" });
      }
      console.log("Données envoyées au client :", latestSensorData); // Log des données envoyées
      res.status(200).json(latestSensorData);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des données :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };