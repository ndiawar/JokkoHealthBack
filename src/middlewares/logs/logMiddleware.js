// src/middlewares/logs/logMiddleware.js

import Log from '../../models/historique/logModel.js';

const logAction = async (req, res, next) => {
    try {
        // Vérifier si un utilisateur est authentifié
        if (!req.user) return next();

        // Créer un log pour chaque requête
        const logEntry = new Log({
            userId: req.user._id,  // Assurez-vous que req.user._id est bien défini
            action: `${req.method} ${req.originalUrl}`, // Log l'action et l'endpoint
            endpoint: req.originalUrl,  // URL demandée
            method: req.method,  // Méthode HTTP (GET, POST, etc.)
            requestData: req.body || {},  // Corps de la requête, vide s'il n'y en a pas
        });

        // Sauvegarder le log dans la base de données de manière asynchrone
        await logEntry.save();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du log :", error);
    }

    // Passer au middleware suivant
    next();
};

export default logAction;
