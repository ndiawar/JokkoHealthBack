import Notification from '../models/notification/notificationModel.js';
import NotificationService from './notificationService.js';
import { AppError } from '../middlewares/error/errorHandler.js';

class NotificationReminderService {
  // Configuration des délais de rappel (en heures)
  static REMINDER_DELAYS = {
    high: 1,    // Rappel après 1 heure
    medium: 4,  // Rappel après 4 heures
    low: 24     // Rappel après 24 heures
  };

  // Configuration des limites de rappel
  static MAX_REMINDERS = {
    high: 3,    // Maximum 3 rappels pour les notifications importantes
    medium: 2,  // Maximum 2 rappels pour les notifications moyennes
    low: 1      // Maximum 1 rappel pour les notifications basiques
  };

  // Vérifier et envoyer les rappels pour les notifications non lues
  async checkAndSendReminders() {
    try {
      const unreadNotifications = await Notification.find({
        isRead: false,
        reminderSent: false,
        reminderCount: { $lt: 3 } // Limite de 3 rappels maximum
      });

      for (const notification of unreadNotifications) {
        const delay = NotificationReminderService.REMINDER_DELAYS[notification.priority];
        const maxReminders = NotificationReminderService.MAX_REMINDERS[notification.priority];
        
        const hoursSinceCreation = (Date.now() - notification.createdAt) / (1000 * 60 * 60);
        
        if (hoursSinceCreation >= delay && notification.reminderCount < maxReminders) {
          await this.sendReminder(notification);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des rappels:', error);
      throw new AppError('Erreur lors de la vérification des rappels', 500);
    }
  }

  // Envoyer un rappel pour une notification
  async sendReminder(notification) {
    try {
      // Créer une notification de rappel
      await NotificationService.createNotification({
        userId: notification.userId,
        title: `Rappel: ${notification.title}`,
        message: `Vous avez une notification non lue: ${notification.message}`,
        type: notification.type,
        priority: notification.priority,
        data: {
          ...notification.data,
          originalNotificationId: notification._id,
          isReminder: true
        }
      });

      // Mettre à jour la notification originale
      notification.reminderSent = true;
      notification.reminderCount += 1;
      notification.lastReminderSent = new Date();
      await notification.save();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      throw new AppError('Erreur lors de l\'envoi du rappel', 500);
    }
  }

  // Créer une notification groupée
  async createGroupedNotification(userId, notifications, groupType = 'daily') {
    try {
      if (!notifications.length) return;

      const groupId = `group_${Date.now()}`;
      const groupedData = {
        notifications: notifications.map(n => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt
        }))
      };

      // Créer la notification groupée
      await NotificationService.createNotification({
        userId,
        title: `Résumé ${groupType} des notifications`,
        message: `Vous avez ${notifications.length} notifications non lues`,
        type: 'system',
        priority: 'low',
        data: groupedData,
        groupId,
        groupType
      });

      // Marquer les notifications originales comme groupées
      await Notification.updateMany(
        { _id: { $in: notifications.map(n => n._id) } },
        { groupId }
      );
    } catch (error) {
      console.error('Erreur lors de la création de la notification groupée:', error);
      throw new AppError('Erreur lors de la création de la notification groupée', 500);
    }
  }

  // Générer les notifications groupées quotidiennes
  async generateDailyGroupedNotifications() {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const unreadNotifications = await Notification.find({
          userId: user._id,
          isRead: false,
          groupId: null,
          createdAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24 heures
          }
        });

        if (unreadNotifications.length > 0) {
          await this.createGroupedNotification(user._id, unreadNotifications, 'daily');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération des notifications groupées:', error);
      throw new AppError('Erreur lors de la génération des notifications groupées', 500);
    }
  }

  // Générer les notifications groupées hebdomadaires
  async generateWeeklyGroupedNotifications() {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const unreadNotifications = await Notification.find({
          userId: user._id,
          isRead: false,
          groupId: null,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Dernière semaine
          }
        });

        if (unreadNotifications.length > 0) {
          await this.createGroupedNotification(user._id, unreadNotifications, 'weekly');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération des notifications groupées:', error);
      throw new AppError('Erreur lors de la génération des notifications groupées', 500);
    }
  }
}

export default new NotificationReminderService(); 