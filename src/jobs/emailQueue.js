// Queue.js - Enlève la dépendance à Redis
import emailService from '../services/email/emailService.js';

class EmailQueue {
    constructor() {
        this.queue = []; // Utilisation d'un tableau pour gérer la queue en mémoire
        this.processing = false; // Flag pour savoir si la queue est en cours de traitement
    }

    // Ajoute un job à la queue
    add(emailData) {
        this.queue.push(emailData); // Ajoute l'email à la file
        this.process(); // Lance le traitement
    }

    // Traitement de la queue
    async process() {
        if (this.processing || this.queue.length === 0) {
            return; // Si déjà en train de traiter ou la queue est vide, on ne fait rien
        }

        this.processing = true;
        const emailData = this.queue.shift(); // Récupère le premier email de la file

        try {
            await emailService.sendEmail(emailData); // Envoi de l'email via emailService
            console.log(`E-mail envoyé à ${emailData.to}`);
        } catch (error) {
            console.error(`Échec de l'envoi de l'e-mail à ${emailData.to}:`, error);
        } finally {
            this.processing = false; // Marque le traitement comme terminé
            this.process(); // Reprend le traitement s'il reste des jobs
        }
    }
}

// Exportation d'une instance de la queue pour être utilisée dans toute l'application
export const emailQueue = new EmailQueue();
