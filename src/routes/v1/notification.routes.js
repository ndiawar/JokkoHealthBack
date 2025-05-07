import express from 'express';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import { notificationRateLimit, validateNotificationData } from '../../middlewares/notification/rateLimitMiddleware.js';
import NotificationController from '../../controllers/notification/notificationController.js';

const router = express.Router();

// Routes existantes avec validation et limite de taux
router.get('/', authenticate, NotificationController.getUserNotifications);
router.get('/unread', authenticate, NotificationController.getUnreadNotifications);
router.put('/:id/read', authenticate, NotificationController.markNotificationAsRead);
router.put('/read-all', authenticate, NotificationController.markAllNotificationsAsRead);
router.delete('/:notificationId', authenticate, NotificationController.deleteNotification);

// Nouvelles routes pour les notifications groupées
router.get('/grouped', authenticate, NotificationController.getGroupedNotifications);
router.get('/grouped/:groupId', authenticate, NotificationController.getGroupedNotificationDetails);
router.put('/grouped/:groupId/read', authenticate, NotificationController.markGroupAsRead);

// Route pour les métriques (admin uniquement)
router.get('/metrics', authenticate, NotificationController.getNotificationMetrics);

export default router; 