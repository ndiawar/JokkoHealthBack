import cron from 'node-cron';
import { cleanupDatabase } from '../services/storage/fileService.js'; // Exemple de service à utiliser pour le nettoyage

// Planifier une tâche de nettoyage qui s'exécute tous les jours à 2h du matin
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('Démarrage du nettoyage de la base de données...');
        await cleanupDatabase();
        console.log('Nettoyage de la base de données terminé.');
    } catch (error) {
        console.error('Erreur lors du nettoyage de la base de données:', error);
    }
});

// Exportation de la tâche cron
export const cleanupTask = cron;
