import Log from '../../models/historique/logModel.js';
import User from '../../models/user/userModel.js';

// Créer un log
export const createLog = async (req, res) => {
    try {
        // Vérifier si l'utilisateur existe
        if (!req.user) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
        }

        // Créer une entrée de log
        const logEntry = new Log({
            userId: req.user._id, // Référence l'utilisateur authentifié
            action: `${req.method} ${req.originalUrl}`, // Action basée sur la requête
            endpoint: req.originalUrl,
            method: req.method,
            requestData: req.body
        });

        // Sauvegarder le log dans la base de données
        await logEntry.save();

        return res.status(201).json({ message: 'Log créé avec succès', log: logEntry });
    } catch (error) {
        console.error('Erreur lors de la création du log:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la création du log' });
    }
};

// Récupérer tous les logs d'un utilisateur
export const getUserLogs = async (req, res) => {
    try {
        // Récupérer l'utilisateur par son ID
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Récupérer les logs associés à cet utilisateur
        const logs = await Log.find({ userId: user._id }).sort({ timestamp: -1 });

        return res.status(200).json({ logs });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des logs' });
    }
};

// Récupérer tous les logs
export const getAllLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 });
        return res.status(200).json({ logs });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des logs' });
    }
};

// Supprimer un log (facultatif)
export const deleteLog = async (req, res) => {
    try {
        const log = await Log.findByIdAndDelete(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Log non trouvé' });
        }
        return res.status(200).json({ message: 'Log supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du log:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression du log' });
    }
};
