// controllers/logController.js
import Log from '../../models/historique/logModel.js';

export const getUserLogs = async (req, res) => {
    try {
        const logs = await Log.find({ userId: req.user._id }).sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des logs.", details: error.message });
    }
};
