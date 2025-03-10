import User from '../../models/user/userModel.js';
import Log from '../../models/historique/logModel.js';

export const createLog = async (req, logData) => {
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            console.error('Utilisateur non authentifié');
            return; // Ne rien faire si l'utilisateur n'est pas authentifié
        }

        // Déboguer les données de log
        console.log('Création du log avec les données suivantes:', logData);

        // Créer une entrée de log
        const logEntry = new Log({
            userId: logData.userId || req.user._id,  // Utilise req.user._id si logData.userId est manquant
            action: logData.action || `${req.method} ${req.originalUrl}`,
            endpoint: logData.endpoint || req.originalUrl,
            method: logData.method || req.method,
            requestData: logData.requestData || req.body
        });

        // Sauvegarder le log dans la base de données
        await logEntry.save();
        console.log('Log créé avec succès');
    } catch (error) {
        console.error('Erreur lors de la création du log:', error);
    }
};


// Récupérer tous les logs d'un utilisateur avec pagination
export const getUserLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Récupérer l'utilisateur par son ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Récupérer les logs associés à cet utilisateur avec pagination
        const logs = await Log.find({ userId: user._id })
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Compter le nombre total de logs pour cet utilisateur
        const count = await Log.countDocuments({ userId: user._id });

        return res.status(200).json({
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des logs' });
    }
};

// Récupérer tous les logs avec pagination et les informations de l'utilisateur
export const getAllLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Récupérer les logs avec les informations de l'utilisateur
        const logs = await Log.find()
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'nom prenom email username')  // Vérifier que 'userId' est une référence valide
            .exec();

        // Compter le nombre total de logs
        const count = await Log.countDocuments();

        // Modifier les logs pour inclure les informations utilisateur dans un format plus facile à manipuler
        const logsWithUserInfo = logs.map(log => ({
            ...log._doc,  // Inclure tous les champs du log
            utilisateur: `${log.userId.prenom} ${log.userId.nom}`,  // Ajouter l'utilisateur complet (nom + prénom)
            email: log.userId.email,  // Ajouter l'email de l'utilisateur
            username: log.userId.username,  // Ajouter le nom d'utilisateur
        }));

        return res.status(200).json({
            logs: logsWithUserInfo,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des logs' });
    }
};



// Supprimer un log (facultatif)
export const deleteLog = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si l'utilisateur a la permission de supprimer ce log
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: 'Permission refusée' });
        }

        const log = await Log.findByIdAndDelete(id);
        if (!log) {
            return res.status(404).json({ message: 'Log non trouvé' });
        }
        return res.status(200).json({ message: 'Log supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du log:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression du log' });
    }
};