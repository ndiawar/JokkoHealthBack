import Notification from '../models/notification/notificationModel.js';
import { AppError } from '../middlewares/error/errorHandler.js';

class NotificationMetricsService {
    // Métriques de performance
    static async getNotificationMetrics() {
        try {
            const metrics = {
                total: await Notification.countDocuments(),
                unread: await Notification.countDocuments({ isRead: false }),
                byType: await Notification.aggregate([
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ]),
                byPriority: await Notification.aggregate([
                    { $group: { _id: '$priority', count: { $sum: 1 } } }
                ]),
                averageResponseTime: await this.calculateAverageResponseTime()
            };
            return metrics;
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques:', error);
            throw new AppError('Erreur lors de la récupération des métriques', 500);
        }
    }

    // Calcul du temps de réponse moyen
    static async calculateAverageResponseTime() {
        try {
            const readNotifications = await Notification.find({
                isRead: true,
                readAt: { $exists: true }
            });

            if (readNotifications.length === 0) return 0;

            const totalResponseTime = readNotifications.reduce((acc, notification) => {
                return acc + (notification.readAt - notification.createdAt);
            }, 0);

            return totalResponseTime / readNotifications.length;
        } catch (error) {
            console.error('Erreur lors du calcul du temps de réponse moyen:', error);
            return 0;
        }
    }

    // Logs détaillés pour le débogage
    static async logNotificationActivity(notification, action) {
        const logEntry = {
            timestamp: new Date(),
            notificationId: notification._id,
            userId: notification.userId,
            action,
            type: notification.type,
            priority: notification.priority,
            isRead: notification.isRead,
            reminderCount: notification.reminderCount
        };

        console.log('Notification Activity:', JSON.stringify(logEntry, null, 2));
        // Ici, vous pourriez ajouter l'envoi des logs vers un service externe
    }

    // Validation des données de notification
    static validateNotificationData(data) {
        const errors = [];

        if (!data.userId) errors.push('userId est requis');
        if (!data.title) errors.push('title est requis');
        if (!data.message) errors.push('message est requis');
        if (!data.type) errors.push('type est requis');
        if (!data.priority) errors.push('priority est requis');

        if (data.type && !['appointment', 'sensor', 'emergency'].includes(data.type)) {
            errors.push('type invalide');
        }

        if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
            errors.push('priority invalide');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Limite de taux pour les API
    static async checkRateLimit(userId) {
        const ONE_HOUR = 60 * 60 * 1000;
        const MAX_NOTIFICATIONS_PER_HOUR = 100;

        const recentNotifications = await Notification.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - ONE_HOUR) }
        });

        return recentNotifications < MAX_NOTIFICATIONS_PER_HOUR;
    }
}

export default NotificationMetricsService; 