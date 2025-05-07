import cron from 'node-cron';
import NotificationReminderService from '../services/notificationReminderService.js';

// Vérifier les rappels toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('Vérification des rappels de notifications...');
  try {
    await NotificationReminderService.checkAndSendReminders();
  } catch (error) {
    console.error('Erreur lors de la vérification des rappels:', error);
  }
});

// Générer les notifications groupées quotidiennes à minuit
cron.schedule('0 0 * * *', async () => {
  console.log('Génération des notifications groupées quotidiennes...');
  try {
    await NotificationReminderService.generateDailyGroupedNotifications();
  } catch (error) {
    console.error('Erreur lors de la génération des notifications groupées quotidiennes:', error);
  }
});

// Générer les notifications groupées hebdomadaires le dimanche à minuit
cron.schedule('0 0 * * 0', async () => {
  console.log('Génération des notifications groupées hebdomadaires...');
  try {
    await NotificationReminderService.generateWeeklyGroupedNotifications();
  } catch (error) {
    console.error('Erreur lors de la génération des notifications groupées hebdomadaires:', error);
  }
}); 