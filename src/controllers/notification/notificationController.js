import NotificationService from '../../services/notificationService.js';

class NotificationController {
    // Obtenir toutes les notifications d'un utilisateur
    static async getUserNotifications(req, res) {
        try {
            const userId = req.user._id;
            const { limit, skip, type, priority } = req.query;
            const options = { limit, skip, type, priority };
            
            const notifications = await NotificationService.getUserNotifications(userId, options);
            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtenir les notifications non lues d'un utilisateur
    static async getUnreadNotifications(req, res) {
        try {
            const userId = req.user._id;
            const notifications = await NotificationService.getUnreadNotifications(userId);
            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Marquer une notification comme lue
    static async markNotificationAsRead(req, res) {
        try {
            // Accepte :id ou :notificationId pour compatibilité
            const notificationId = req.params.id || req.params.notificationId;
            const notification = await NotificationService.markNotificationAsRead(notificationId);
            res.status(200).json({
                success: true,
                data: notification
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Marquer toutes les notifications comme lues
    static async markAllNotificationsAsRead(req, res) {
        try {
            const userId = req.user._id;
            const result = await NotificationService.markAllNotificationsAsRead(userId);
            res.status(200).json({
                success: true,
                message: 'Toutes les notifications ont été marquées comme lues',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Supprimer une notification
    static async deleteNotification(req, res) {
        try {
            // Accepte :notificationId ou :id pour compatibilité
            const notificationId = req.params.notificationId || req.params.id;
            const notification = await NotificationService.deleteNotification(notificationId);
            res.status(200).json({
                success: true,
                message: 'Notification supprimée avec succès',
                data: notification
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtenir les notifications groupées
    static async getGroupedNotifications(req, res) {
        try {
            const userId = req.user._id;
            const notifications = await NotificationService.getGroupedNotifications(userId);
            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtenir les détails d'un groupe de notifications
    static async getGroupedNotificationDetails(req, res) {
        try {
            const { groupId } = req.params;
            const notifications = await NotificationService.getGroupedNotificationDetails(groupId);
            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Marquer un groupe de notifications comme lu
    static async markGroupAsRead(req, res) {
        try {
            const { groupId } = req.params;
            const result = await NotificationService.markGroupAsRead(groupId);
            res.status(200).json({
                success: true,
                message: 'Groupe de notifications marqué comme lu',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtenir les métriques des notifications (admin uniquement)
    static async getNotificationMetrics(req, res) {
        try {
            const metrics = await NotificationService.getNotificationMetrics();
            res.status(200).json({
                success: true,
                data: metrics
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default NotificationController; 