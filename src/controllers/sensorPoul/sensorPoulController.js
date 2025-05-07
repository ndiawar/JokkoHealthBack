import mongoose from 'mongoose';
import Sensor from '../../models/sensor/sensorModel.js';
import User from '../../models/user/userModel.js'; // Assurez-vous d'importer le modèle User
import { v4 as uuidv4 } from 'uuid'; // Importer uuid pour générer un sensorId unique
import MedicalRecord from '../../models/medical/medicalModel.js'; // Importer le modèle MedicalRecord
import NotificationService from '../../services/notificationService.js';
import { AppError } from '../../middlewares/error/errorHandler.js';

// Store pour les connexions SSE
const activeConnections = new Map();
let latestSensorData = null;

// Store pour suivre les anomalies persistantes
const anomalyTracking = new Map();

// Fonction pour vérifier si les anomalies sont persistantes
const checkPersistentAnomalies = async (sensorId, anomalies, heartRate, oxygenLevel) => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  if (!anomalyTracking.has(sensorId)) {
    anomalyTracking.set(sensorId, {
      anomalies: [],
      lastCheck: now,
      readings: []
    });
  }

  const tracking = anomalyTracking.get(sensorId);
  tracking.readings.push({
    timestamp: now,
    heartRate,
    oxygenLevel,
    anomalies
  });

  // Garder seulement les lectures des 5 dernières minutes
  tracking.readings = tracking.readings.filter(reading => reading.timestamp > fiveMinutesAgo);

  // Vérifier si les anomalies sont persistantes
  const persistentAnomalies = [];
  const anomalyTypes = new Set(anomalies);

  for (const type of anomalyTypes) {
    const anomalyReadings = tracking.readings.filter(reading => 
      reading.anomalies.includes(type)
    );

    if (anomalyReadings.length >= 3) { // Au moins 3 lectures avec la même anomalie
      persistentAnomalies.push(type);
    }
  }

  return persistentAnomalies;
};

// Validation des données d'entrée
const validateSensorData = (data) => {
  const { heartRate, oxygenLevel, macAddress, timestamp } = data;
  
  if (!heartRate || !oxygenLevel || !macAddress || !timestamp) {
    throw new AppError('Données manquantes', 400);
  }

  if (!validateHeartRate(heartRate)) {
    throw new AppError('Fréquence cardiaque invalide', 400);
  }

  if (!validateOxygenLevel(oxygenLevel)) {
    throw new AppError('Niveau d\'oxygène invalide', 400);
  }

  if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress)) {
    throw new AppError('Format d\'adresse MAC invalide', 400);
  }

  return true;
};

export const assignSensorToUser = async (req, res, next) => {
  try {
    // Vérification du rôle
    if (req.user.role !== 'Medecin') {
      throw new AppError('Seuls les médecins peuvent assigner des capteurs', 403);
    }

    const { macAddress, recordId } = req.body;

    // Validation des données d'entrée
    if (!macAddress || !recordId) {
      throw new AppError('Adresse MAC et ID du dossier médical nécessaires', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new AppError('ID du dossier médical invalide', 400);
    }

    // Récupération des données en parallèle pour optimiser les performances
    const [medicalRecord, existingSensor] = await Promise.all([
      MedicalRecord.findById(recordId),
      Sensor.findOne({ mac: macAddress })
    ]);

    if (!medicalRecord) {
      throw new AppError('Dossier médical non trouvé', 404);
    }

    if (existingSensor && existingSensor.medicalRecord) {
      throw new AppError('Ce capteur est déjà assigné à un dossier médical', 400);
    }

    const userId = medicalRecord.patientId;
    if (!userId) {
      throw new AppError('ID de l\'utilisateur non trouvé dans le dossier médical', 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Création et sauvegarde du capteur
    const newSensor = new Sensor({
      mac: macAddress,
      medicalRecord: recordId,
      heartRate: 0,
      spo2: 0,
      anomalies: [],
      status: 'Active',
      sensorId: uuidv4(),
    });

    // Utilisation de Promise.all pour les opérations parallèles
    const [savedSensor, updatedRecord] = await Promise.all([
      newSensor.save(),
      MedicalRecord.findByIdAndUpdate(
        recordId,
        { sensor: newSensor._id },
        { new: true }
      )
    ]);

    // Récupération des SuperAdmin en parallèle avec les autres opérations
    const superAdmins = await User.find({ role: 'SuperAdmin' });

    // Création des notifications en parallèle
    const notificationPromises = [
      // Notification pour le patient
      NotificationService.createNotification({
        userId: userId,
        title: 'Nouveau Capteur Assigné',
        message: `Le Dr. ${req.user.nom} ${req.user.prenom} vous a assigné un nouveau capteur de pouls`,
        type: 'sensor',
        priority: 'medium',
        data: {
          sensorId: savedSensor._id,
          macAddress,
          doctorId: req.user._id,
          doctorName: `${req.user.nom} ${req.user.prenom}`
        }
      }),
      // Notifications pour les SuperAdmin
      ...superAdmins.map(superAdmin => 
        NotificationService.createNotification({
          userId: superAdmin._id,
          title: 'Nouveau Capteur Assigné',
          message: `Le Dr. ${req.user.nom} ${req.user.prenom} a assigné un nouveau capteur au patient ${user.nom} ${user.prenom}`,
          type: 'sensor',
          priority: 'low',
          data: {
            sensorId: savedSensor._id,
            macAddress,
            doctorId: req.user._id,
            doctorName: `${req.user.nom} ${req.user.prenom}`,
            patientId: userId,
            patientName: `${user.nom} ${user.prenom}`
          }
        })
      )
    ];

    await Promise.all(notificationPromises);

    res.status(200).json({
      message: "Capteur assigné au dossier médical avec succès",
      sensor: savedSensor,
      medicalRecord: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

export const receiveSensorData = async (req, res, next) => {
  try {
    // Validation des données d'entrée
    validateSensorData(req.body);

    let { heartRate, oxygenLevel, macAddress, timestamp } = req.body;

    // Formatage du timestamp
    let date = new Date();
    if (timestamp && !timestamp.includes("T")) {
      const [hour, minute, second] = timestamp.split(":");
      date.setHours(hour, minute, second, 0);
      timestamp = date.toISOString();
    }

    // Récupération du capteur
    const sensor = await Sensor.findOne({ mac: macAddress });
    if (!sensor) {
      throw new AppError('Capteur non trouvé', 404);
    }

    // Mise à jour des données du capteur
    sensor.heartRate = heartRate;
    sensor.spo2 = oxygenLevel;
    sensor.timestamp = timestamp;

    const { anomalies, isEmergency } = detectAnomalies(heartRate, oxygenLevel);
    
    // Vérifier si les anomalies sont persistantes
    const persistentAnomalies = await checkPersistentAnomalies(
      sensor._id,
      anomalies,
      heartRate,
      oxygenLevel
    );

    // Ne créer des notifications que si les anomalies sont persistantes
    if (persistentAnomalies.length > 0) {
      const [medicalRecord, doctor] = await Promise.all([
        MedicalRecord.findById(sensor.medicalRecord),
        User.findById(sensor.medicalRecord?.medecinId)
      ]);

      if (medicalRecord) {
        const notificationPromises = [];

        if (isEmergency) {
          // Notifications d'urgence
          notificationPromises.push(
            // Notification patient
            NotificationService.createNotification({
              userId: medicalRecord.patientId,
              title: '🚨 URGENCE MÉDICALE',
              message: `URGENCE : Des anomalies critiques ont été détectées dans vos données de santé : ${persistentAnomalies.join(', ')}`,
              type: 'emergency',
              priority: 'high',
              data: {
                sensorId: sensor._id,
                heartRate,
                oxygenLevel,
                anomalies: persistentAnomalies,
                timestamp,
                isEmergency: true
              }
            }),
            // Notification médecin si disponible
            doctor && NotificationService.createNotification({
              userId: doctor._id,
              title: '🚨 URGENCE PATIENT',
              message: `URGENCE : Anomalies critiques détectées pour le patient ${medicalRecord.patientId}. ${persistentAnomalies.join(', ')}`,
              type: 'emergency',
              priority: 'high',
              data: {
                sensorId: sensor._id,
                patientId: medicalRecord.patientId,
                heartRate,
                oxygenLevel,
                anomalies: persistentAnomalies,
                timestamp,
                isEmergency: true
              }
            }),
            // Notifications SuperAdmin
            User.find({ role: 'SuperAdmin' }).then(superAdmins => 
              Promise.all(superAdmins.map(superAdmin =>
                NotificationService.createNotification({
                  userId: superAdmin._id,
                  title: '🚨 URGENCE SYSTÈME',
                  message: `URGENCE : Anomalies critiques détectées pour le patient ${medicalRecord.patientId}. ${persistentAnomalies.join(', ')}`,
                  type: 'emergency',
                  priority: 'high',
                  data: {
                    sensorId: sensor._id,
                    patientId: medicalRecord.patientId,
                    doctorId: doctor?._id,
                    heartRate,
                    oxygenLevel,
                    anomalies: persistentAnomalies,
                    timestamp,
                    isEmergency: true
                  }
                })
              ))
            )
          );
        } else {
          // Notifications pour anomalies non critiques
          notificationPromises.push(
            // Notification pour le patient
            NotificationService.createNotification({
              userId: medicalRecord.patientId,
              title: '⚠️ Anomalies Persistantes Détectées',
              message: `Des anomalies persistantes ont été détectées dans vos données de santé : ${persistentAnomalies.join(', ')}`,
              type: 'sensor',
              priority: 'medium',
              data: {
                sensorId: sensor._id,
                heartRate,
                oxygenLevel,
                anomalies: persistentAnomalies,
                timestamp,
                isEmergency: false
              }
            }),
            // Notification pour le médecin
            doctor && NotificationService.createNotification({
              userId: doctor._id,
              title: '⚠️ Anomalies Persistantes Patient',
              message: `Des anomalies persistantes ont été détectées pour le patient ${medicalRecord.patientId} : ${persistentAnomalies.join(', ')}`,
              type: 'sensor',
              priority: 'medium',
              data: {
                sensorId: sensor._id,
                patientId: medicalRecord.patientId,
                heartRate,
                oxygenLevel,
                anomalies: persistentAnomalies,
                timestamp,
                isEmergency: false
              }
            })
          );
        }

        await Promise.all(notificationPromises.filter(Boolean));
      }
    }

    // Mise à jour des données en temps réel
    latestSensorData = {
      heartRate,
      oxygenLevel,
      macAddress,
      timestamp,
      anomalies: persistentAnomalies,
      isEmergency
    };

    // Envoi des données aux clients connectés
    if (activeConnections.has(sensor.medicalRecord.toString())) {
      const clients = activeConnections.get(sensor.medicalRecord.toString());
      for (const client of clients) {
        client.write(`data: ${JSON.stringify(latestSensorData)}\n\n`);
      }
    }

    res.status(200).json({
      message: "Données reçues et mises à jour avec succès",
      sensorData: latestSensorData
    });
  } catch (error) {
    next(error);
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

// Validation de la fréquence cardiaque
const validateHeartRate = (heartRate) => {
  return heartRate >= 40 && heartRate <= 200;
};

// Détection des anomalies
const detectAnomalies = (heartRate, oxygenLevel) => {
  let anomalies = [];
  let isEmergency = false;

  // Validation plus stricte des données
  if (heartRate < 40 || heartRate > 200) {
    return { anomalies: [], isEmergency: false }; // Ignorer les valeurs manifestement erronées
  }

  if (oxygenLevel < 0 || oxygenLevel > 100) {
    return { anomalies: [], isEmergency: false }; // Ignorer les valeurs manifestement erronées
  }

  // Anomalies de fréquence cardiaque avec validation
  if (heartRate < 40) {
    anomalies.push("Bradycardie extrême détectée! Fréquence cardiaque trop basse.");
    isEmergency = true;
  } else if (heartRate < 50) {
    anomalies.push("Bradycardie détectée! Fréquence cardiaque trop basse.");
  } else if (heartRate > 100) {
    anomalies.push("Tachycardie détectée! Fréquence cardiaque trop élevée.");
  }

  // Anomalies de saturation en oxygène avec validation
  if (oxygenLevel < 90) {
    anomalies.push("Hypoxémie détectée! SpO2 trop bas.");
  }
  if (oxygenLevel < 85) {
    anomalies.push("Danger critique! SpO2 trop bas.");
    isEmergency = true;
  }

  return { anomalies, isEmergency };
};

// Validation de la saturation en oxygène
const validateOxygenLevel = (oxygenLevel) => {
  return oxygenLevel >= 0 && oxygenLevel <= 100;
};