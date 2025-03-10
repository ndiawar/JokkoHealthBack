// middlewares/LogMiddleware.js
import Log from "../models/historique/logModel.js";

export const logActivity = async (req, res, next) => {
    try {
        if (!req.user) return next(); // Si pas d'utilisateur, ne pas loguer

        const logEntry = new Log({
            userId: req.user._id,
            action: `${req.method} ${req.originalUrl}`,
            endpoint: req.originalUrl,
            method: req.method,
            requestData: req.body,
            ipAddress: req.ip, // Adresse IP du client
            userAgent: req.headers["user-agent"], // Informations sur le navigateur ou l'appareil
        });

        await logEntry.save();
    } catch (error) {
        console.error("Erreur lors de la création du log:", error);
    }

    next(); // Passer à la prochaine étape du middleware
};
