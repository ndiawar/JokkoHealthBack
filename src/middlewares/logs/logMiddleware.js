import Log from '../../models/historique/logModel.js';

const logAction = async (req, res, next) => {
    try {
        // Vérifier si un utilisateur est authentifié
        if (!req.user) return next();

        const logEntry = new Log({
            userId: req.user._id,
            action: `${req.method} ${req.originalUrl}`, // Correction ici
            endpoint: req.originalUrl,
            method: req.method,
            requestData: req.body
        });

        await logEntry.save();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du log :", error);
    }

    next();
};

export default logAction;
