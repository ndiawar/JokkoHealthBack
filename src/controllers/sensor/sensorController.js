import Notification from "../../models/notification/notificationModel.js";
import mongoose from "mongoose";
// 🔔 Créer une notification à partir des données du capteur
export const createSensorNotification = async (req, res) => {
    try {
        const { userId, message } = req.body;

        // Vérifier que l'ID est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'ID utilisateur invalide.' });
        }

        // Créer la notification
        const newNotification = new Notification({
            userId,
            message,
            type: 'sensor' // Type de notification pour les données du capteur
        });

        await newNotification.save(); // Sauvegarde la notification dans MongoDB

        // Utilisation de populate pour ajouter les informations de l'utilisateur (prenom, nom, email)
        const populatedNotification = await Notification.findById(newNotification._id)
            .populate('userId', 'prenom nom email');  // Spécification des champs dans l'ordre souhaité

        // Envoyer la notification via WebSocket
        req.io.emit("receive-notification", { 
            userId, 
            message, 
            notification: populatedNotification 
        });

        res.status(200).json({ 
            message: "Notification créée avec succès.", 
            notification: populatedNotification 
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création de la notification.", details: error.message });
    }
};