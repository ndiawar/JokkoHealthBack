// Ce fichier configure les files d'attente pour les tâches asynchrones.

import Queue from 'bull';

// Configuration de la file d'attente
const emailQueue = new Queue('emailQueue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Traitement des tâches dans la file d'attente
emailQueue.process(async (job) => {
  // Logique pour traiter l'envoi d'e-mails
  console.log(`Traitement de l'envoi d'e-mail pour le job ${job.id}`);
  // Ajoutez ici votre logique d'envoi d'e-mail
});

// Gestion des événements de la file d'attente
emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} terminé avec succès`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} échoué avec l'erreur: ${err.message}`);
});

export { emailQueue };