import Notification from '../models/notification/notificationModel.js';
import User from '../models/user/userModel.js';

class NotificationService {
    // Créer une nouvelle notification
    static async createNotification(data) {
        try {
            const notification = await Notification.createNotification(data);
            return notification;
        } catch (error) {
            throw new Error(`Erreur lors de la création de la notification: ${error.message}`);
        }
    }

    // Créer une notification pour un rendez-vous
    static async createAppointmentNotification(userId, appointmentData) {
        const notification = {
            userId,
            title: 'Nouveau Rendez-vous',
            message: `Vous avez un rendez-vous le ${new Date(appointmentData.date).toLocaleDateString()} à ${appointmentData.heure_debut}`,
            type: 'appointment',
            priority: 'medium',
            data: appointmentData
        };
        return this.createNotification(notification);
    }

    // Créer une notification pour une alerte de capteur
    static async createSensorAlertNotification(userId, sensorData) {
        const notification = {
            userId,
            title: 'Alerte Capteur',
            message: `Anomalie détectée dans les données du capteur: ${sensorData.anomalies.join(', ')}`,
            type: 'sensor',
            priority: 'high',
            data: sensorData
        };
        return this.createNotification(notification);
    }

    // Créer une notification d'urgence
    static async createEmergencyNotification(userId, emergencyData) {
        const notification = {
            userId,
            title: 'URGENCE MÉDICALE',
            message: emergencyData.message,
            type: 'emergency',
            priority: 'urgent',
            data: emergencyData
        };
        return this.createNotification(notification);
    }

    // Obtenir toutes les notifications d'un utilisateur
    static async getUserNotifications(userId, options = {}) {
        try {
            return await Notification.getUserNotifications(userId, options);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
        }
    }

    // Obtenir les notifications non lues d'un utilisateur
    static async getUnreadNotifications(userId) {
        try {
            return await Notification.getUnreadNotifications(userId);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications non lues: ${error.message}`);
        }
    }

    // Marquer une notification comme lue
    static async markNotificationAsRead(notificationId) {
        try {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                throw new Error('Notification non trouvée');
            }
            return await notification.markAsRead();
        } catch (error) {
            throw new Error(`Erreur lors du marquage de la notification comme lue: ${error.message}`);
        }
    }

    // Marquer toutes les notifications d'un utilisateur comme lues
    static async markAllNotificationsAsRead(userId) {
        try {
            return await Notification.updateMany(
                { userId, isRead: false },
                { 
                    isRead: true,
                    readAt: new Date()
                }
            );
        } catch (error) {
            throw new Error(`Erreur lors du marquage de toutes les notifications comme lues: ${error.message}`);
        }
    }

    // Supprimer une notification
    static async deleteNotification(notificationId) {
        try {
            const notification = await Notification.findByIdAndDelete(notificationId);
            if (!notification) {
                throw new Error('Notification non trouvée');
            }
            return notification;
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la notification: ${error.message}`);
        }
    }

    // Obtenir les notifications groupées d'un utilisateur
    static async getGroupedNotifications(userId) {
        try {
            // Récupérer les notifications non lues groupées par type
            const groupedNotifications = await Notification.aggregate([
                {
                    $match: {
                        userId: userId,
                        isRead: false
                    }
                },
                {
                    $group: {
                        _id: {
                            type: "$type",
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                        },
                        count: { $sum: 1 },
                        notifications: { $push: "$$ROOT" },
                        latestNotification: { $last: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        groupId: "$_id",
                        type: "$_id.type",
                        date: "$_id.date",
                        count: 1,
                        latestNotification: 1,
                        notifications: 1
                    }
                },
                {
                    $sort: { "latestNotification.createdAt": -1 }
                }
            ]);

            return groupedNotifications;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications groupées: ${error.message}`);
        }
    }

    // Obtenir les détails d'un groupe de notifications
    static async getGroupedNotificationDetails(groupId) {
        try {
            const [type, date] = groupId.split('_');
            const notifications = await Notification.find({
                type,
                createdAt: {
                    $gte: new Date(date),
                    $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                }
            }).sort({ createdAt: -1 });

            return notifications;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des détails du groupe: ${error.message}`);
        }
    }

    // Marquer un groupe de notifications comme lu
    static async markGroupAsRead(groupId) {
        try {
            const [type, date] = groupId.split('_');
            const result = await Notification.updateMany(
                {
                    type,
                    createdAt: {
                        $gte: new Date(date),
                        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                    },
                    isRead: false
                },
                {
                    isRead: true,
                    readAt: new Date()
                }
            );

            return result;
        } catch (error) {
            throw new Error(`Erreur lors du marquage du groupe comme lu: ${error.message}`);
        }
    }

    // Obtenir les métriques des notifications
    static async getNotificationMetrics() {
        try {
            const metrics = await Notification.aggregate([
                {
                    $group: {
                        _id: {
                            type: "$type",
                            priority: "$priority"
                        },
                        count: { $sum: 1 },
                        unreadCount: {
                            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id.type",
                        priority: "$_id.priority",
                        totalCount: "$count",
                        unreadCount: 1
                    }
                }
            ]);

            return metrics;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des métriques: ${error.message}`);
        }
    }
}

export default NotificationService; 