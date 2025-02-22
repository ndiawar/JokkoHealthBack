import Notification from '../../models/notification/notificationModel.js';
import User from '../../models/user/userModel.js';
import mongoose from 'mongoose';

// 🔔 Ajouter une notification
export const createNotification = async (req, res) => {
    try {
        const { userId, type, message } = req.body;

        // Vérifier que l'ID est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'ID utilisateur invalide.' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Utilisateur introuvable.' });
        }

        // Créer la notification
        const newNotification = new Notification({
            userId,
            message,
            type
        });

        await newNotification.save(); // Sauvegarde la notification dans MongoDB

        res.status(200).json({ message: "Notification créée avec succès.", notification: newNotification });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création de la notification.", details: error.message });
    }
};
// 📩 Récupérer les notifications d'un utilisateur
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des notifications.", details: error.message });
    }
};

// ✅ Marquer une notification comme lue
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Vérifier si la notification existe
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: "Notification non trouvée." });
        }

        // Marquer la notification comme lue
        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: "Notification désactivée avec succès.", notification });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la désactivation de la notification.", details: error.message });
    }
};
export const disableNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Vérifier si la notification existe
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: "Notification non trouvée." });
        }

        // Désactiver la notification
        notification.isActive = false;
        await notification.save();

        res.status(200).json({ message: "Notification désactivée avec succès.", notification });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la désactivation de la notification.", details: error.message });
    }
};
