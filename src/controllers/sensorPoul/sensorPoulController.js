import mongoose from 'mongoose';
import Sensor from '../../models/sensor/sensorModel.js';
import User from '../../models/user/userModel.js'; // Assurez-vous d'importer le modèle User
import { v4 as uuidv4 } from 'uuid'; // Importer uuid pour générer un sensorId unique
import MedicalRecord from '../../models/medical/medicalModel.js'; // Importer le modèle MedicalRecord

// Store pour les connexions SSE
const activeConnections = new Map();
let latestSensorData = null;


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

    // Vérifier que req.user est défini
    if (!req.user || !req.user._id) {
      console.log("Utilisateur non authentifié"); // Log de l'utilisateur non authentifié
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const medecinId = req.user._id; // Supposant que l'authentification est en place

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

    // Vérifier si le capteur existe déjà et est assigné à un autre dossier médical
    const existingSensor = await Sensor.findOne({ mac: macAddress });
    if (existingSensor && existingSensor.medicalRecord) {
      console.log("Capteur déjà assigné :", macAddress); // Log du capteur déjà assigné
      return res.status(400).json({ message: "Ce capteur est déjà assigné à un dossier médical" });
    }

    // Si le capteur n'est pas encore assigné, on peut l'assigner au dossier médical
    const newSensor = new Sensor({
      mac: macAddress,
      medicalRecord: recordId, // Utiliser l'ID du dossier médical récupéré
      heartRate: 0, // Valeur par défaut
      spo2: 0, // Valeur par défaut
      anomalies: [],
      status: 'Active',
      sensorId: uuidv4(), // Générer un sensorId unique
    });

    // Enregistrer le capteur
    await newSensor.save();

    // Après await newSensor.save();
    medicalRecord.sensor = newSensor._id;
    await medicalRecord.save();

    console.log("Capteur assigné avec succès :", newSensor); // Log du capteur assigné

    // Répondre au client
    res.status(200).json({
      message: "Capteur assigné au dossier médical avec succès",
      sensor: newSensor,
      medicalRecord: medicalRecord // Inclure le dossier médical dans la réponse
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'assignation du capteur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Méthode pour recevoir et mettre à jour les données du capteur en temps réel
export const receiveSensorData = async (req, res) => {
  try {
    let { heartRate, oxygenLevel, macAddress, timestamp } = req.body; // Changer const en let pour pouvoir réassigner timestamp

    // Log des données reçues pour vérifier qu'elles sont bien envoyées
    console.log("🔹 Données reçues depuis ESP8266 :");
    console.log(`💓 Fréquence cardiaque : ${heartRate} BPM`);
    console.log(`🩸 Saturation O2 : ${oxygenLevel}%`);
    console.log(`📡 Adresse MAC : ${macAddress}`);
    console.log(`🕰️ Heure des données : ${timestamp}`);

    // Vérifier que toutes les données nécessaires sont bien reçues
    if (!heartRate || !oxygenLevel || !macAddress || !timestamp) {
      console.log("❌ Erreur : Données manquantes");
      return res.status(400).json({ message: "Données manquantes" });
    }

    // Validation de la fréquence cardiaque et de la saturation en oxygène
    if (!validateHeartRate(heartRate) || !validateOxygenLevel(oxygenLevel)) {
      return res.status(400).json({ message: "Données invalides" });
    }

    // Si le timestamp est au format "HH:mm:ss", ajouter une date par défaut (par exemple, aujourd'hui)
    let date = new Date(); // Date actuelle
    if (timestamp && !timestamp.includes("T")) {
      // Ajouter la date actuelle pour construire une date complète
      const [hour, minute, second] = timestamp.split(":");
      date.setHours(hour, minute, second, 0);  // Réglage de l'heure, minute, seconde
      // Mettre à jour le format du timestamp
      timestamp = date.toISOString();  // Transforme en format ISO
    }

    // Recherche du capteur via l'adresse MAC
    console.log("🔍 Recherche du capteur avec l'adresse MAC :", macAddress);
    const sensor = await Sensor.findOne({ mac: macAddress });

    if (!sensor) {
      console.log("❌ Erreur : Capteur non trouvé pour l'adresse MAC", macAddress);
      return res.status(404).json({ message: "Capteur non trouvé" });
    }

    // Mise à jour des données du capteur avec les nouvelles valeurs
    console.log("📦 Mise à jour des données du capteur avec les nouvelles valeurs...");
    sensor.heartRate = heartRate;
    sensor.spo2 = oxygenLevel;
    sensor.timestamp = timestamp;

    // Détection des anomalies
    const anomalies = detectAnomalies(heartRate, oxygenLevel);
    sensor.anomalies = anomalies;

    // Sauvegarde du capteur mis à jour dans la base de données
    console.log("💾 Sauvegarde des données mises à jour dans la base de données...");
    await sensor.save();

    // Après await sensor.save();
    latestSensorData = {
      heartRate,
      oxygenLevel,
      macAddress,
      timestamp,
      anomalies
    };

    // Après la mise à jour de latestSensorData
    if (activeConnections.has(sensor.medicalRecord.toString())) {
      const clients = activeConnections.get(sensor.medicalRecord.toString());
      for (const client of clients) {
        client.write(`data: ${JSON.stringify(latestSensorData)}\n\n`);
      }
    }

    // Log des anomalies détectées (si elles existent)
    if (anomalies.length > 0) {
      console.log("🚨 Anomalies détectées :", anomalies);
    } else {
      console.log("✅ Aucune anomalie détectée.");
    }

    // Réponse au client (ESP8266)
    console.log("✅ Réponse envoyée au client avec succès.");
    res.status(200).json({
      message: "Données reçues et mises à jour avec succès",
      sensorData: {
        heartRate,
        oxygenLevel,
        macAddress,
        timestamp,
        anomalies
      }
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


// Endpoint pour récupérer les données du capteur pour un dossier médical donné
export const getSensorDataByRecordId = async (req, res) => {
  try {
    const { recordId } = req.params;

    // Vérifier que recordId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      console.log("ID du dossier médical invalide :", recordId);
      return res.status(400).json({ message: "ID du dossier médical invalide" });
    }

    // Recherche du dossier médical en fonction de l'ID du dossier médical
    const medicalRecord = await MedicalRecord.findOne({ _id: recordId });

    // Vérifier si le dossier médical existe
    if (!medicalRecord) {
      console.log("❌ Dossier médical non trouvé pour cet ID.");
      return res.status(404).json({ message: "Dossier médical non trouvé." });
    }

    // Recherche du capteur associé à ce dossier médical
    const sensorData = await Sensor.findOne({ medicalRecord: recordId });

    // Vérifier si le capteur existe pour ce dossier médical
    if (!sensorData) {
      console.log("❌ Capteur non trouvé pour l'ID du dossier médical", recordId);
      return res.status(404).json({ message: "Capteur non trouvé pour ce dossier médical." });
    }

    // Répondre au client avec les données du capteur en temps réel
    res.status(200).json({
      sensorId: sensorData.sensorId,
      mac: sensorData.mac,
      heartRate: sensorData.heartRate,
      spo2: sensorData.spo2,
      anomalies: sensorData.anomalies,
      status: sensorData.status,
      timestamp: sensorData.timestamp,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données du capteur :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des données du capteur." });
  }
};


// Endpoint pour récupérer les données du capteur pour tous les patients
export const getSensorDataForCurrentPatient = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien authentifié
    if (!req.user) {
      console.log("❌ Utilisateur non authentifié");
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { id: userId, role } = req.user;
    console.log(`🔍 Recherche des données pour l'utilisateur: ${userId}, rôle: ${role}`);

    // Vérifier si l'utilisateur est un patient
    if (role !== 'Patient') {
      console.log(`❌ Rôle invalide: ${role}, attendu: Patient`);
      return res.status(403).json({ message: "Accès refusé : Seul un patient peut accéder à ses données de capteur." });
    }

    // Recherche du dossier médical en fonction de l'ID de l'utilisateur (patientId)
    const medicalRecord = await MedicalRecord.findOne({ patientId: userId });
    console.log(`📁 Dossier médical trouvé: ${medicalRecord ? 'Oui' : 'Non'}`);

    // Vérifier si le dossier médical existe pour ce patient
    if (!medicalRecord) {
      console.log(`❌ Dossier médical non trouvé pour l'utilisateur: ${userId}`);
      return res.status(404).json({ message: "Dossier médical non trouvé pour cet utilisateur." });
    }

    // Recherche du capteur associé à ce dossier médical
    const sensorData = await Sensor.findOne({ medicalRecord: medicalRecord._id });
    console.log(`📡 Capteur trouvé: ${sensorData ? 'Oui' : 'Non'}`);

    // Vérifier si le capteur existe pour ce dossier médical
    if (!sensorData) {
      console.log(`❌ Capteur non trouvé pour le dossier médical: ${medicalRecord._id}`);
      return res.status(404).json({ message: "Capteur non trouvé pour ce dossier médical." });
    }

    // Répondre au client avec les données du capteur
    console.log(`✅ Données du capteur récupérées avec succès pour l'utilisateur: ${userId}`);
    res.status(200).json({
      message: "Données du capteur récupérées avec succès",
      sensorData: {
        sensorId: sensorData.sensorId,
        mac: sensorData.mac,
        heartRate: sensorData.heartRate,
        spo2: sensorData.spo2,
        anomalies: sensorData.anomalies,
        status: sensorData.status,
        timestamp: sensorData.timestamp,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données du capteur :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des données du capteur." });
  }
};

// Nouvelle méthode pour récupérer les données du capteur pour l'utilisateur connecté
export const getSensorDataForCurrentUser = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      console.log("Utilisateur non authentifié"); // Log de l'utilisateur non authentifié
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = req.user._id;
    console.log("Utilisateur authentifié :", userId); // Log de l'utilisateur authentifié

    // Récupérer le dossier médical de l'utilisateur
    const medicalRecord = await MedicalRecord.findOne({ patientId: userId });
    if (!medicalRecord) {
      console.log("Dossier médical non trouvé pour l'utilisateur :", userId); // Log du dossier médical non trouvé
      return res.status(404).json({ message: "Dossier médical non trouvé" });
    }

    // Vérifier si un capteur est assigné au dossier médical
    const sensor = await Sensor.findOne({ medicalRecord: medicalRecord._id });
    if (!sensor) {
      console.log("Capteur non trouvé pour le dossier médical :", medicalRecord._id); // Log du capteur non trouvé
      return res.status(404).json({ message: "Capteur non trouvé" });
    }

    // Répondre au client avec les données du capteur
    res.status(200).json(sensor);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données du capteur pour l'utilisateur connecté :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Validation de la fréquence cardiaque réaliste
const validateHeartRate = (heartRate) => {
  // Fréquence cardiaque trop basse (inférieure à 40) ou trop élevée (supérieure à 200)
  if (heartRate < 40 || heartRate > 200) {
    console.log("❌ Fréquence cardiaque irréaliste détectée. La valeur a été ignorée.");
    return false;
  }
  return true;
};

// Détection des anomalies
const detectAnomalies = (heartRate, oxygenLevel) => {
  let anomalies = [];

  // Anomalies de fréquence cardiaque
  if (heartRate < 40) {
    anomalies.push("Bradycardie extrême détectée! Fréquence cardiaque trop basse.");
  } else if (heartRate < 50) {
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

// Validation de la saturation en oxygène réaliste
const validateOxygenLevel = (oxygenLevel) => {
  // La saturation en oxygène doit être entre 0 et 100 %
  if (oxygenLevel < 0 || oxygenLevel > 100) {
    console.log("❌ Saturation O2 irréaliste détectée. La valeur a été ignorée.");
    return false;
  }
  return true;
};