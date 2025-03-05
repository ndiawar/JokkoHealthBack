import User from '../../models/user/userModel.js';

// Méthode pour obtenir le total des patients, médecins et SuperAdmins
export const getTotalUsersByRole = async (req, res) => {
    try {
        // Compter les utilisateurs par rôle
        const totalPatients = await User.countDocuments({ role: 'Patient' });
        const totalMedecins = await User.countDocuments({ role: 'Medecin' });
        const totalSuperAdmins = await User.countDocuments({ role: 'SuperAdmin' });

        // Réponse en cas de succès
        res.status(200).json({
            success: true,
            message: 'Totaux des utilisateurs récupérés avec succès.',
            data: {
                totalPatients,
                totalMedecins,
                totalSuperAdmins
            }
        });
    } catch (error) {
        // Gestion des erreurs
        console.error('Erreur lors de la récupération des totaux des utilisateurs :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des totaux des utilisateurs.',
            error: error.message
        });
    }
};

// Méthode pour filtrer les patients
export const filterPatients = async (req, res) => {
    try {
        // Récupérer tous les patients (en excluant les champs sensibles)
        const patients = await User.find({ role: 'Patient' }).select('-motDePasse -resetPasswordToken -resetPasswordExpires');

        // Vérifier si des patients ont été trouvés
        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun patient trouvé.'
            });
        }

        // Réponse en cas de succès
        res.status(200).json({
            success: true,
            message: 'Patients récupérés avec succès.',
            data: patients
        });
    } catch (error) {
        // Gestion des erreurs
        console.error('Erreur lors du filtrage des patients :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors du filtrage des patients.',
            error: error.message
        });
    }
};

// Méthode pour filtrer les patients et les médecins pour chaque fin de mois
export const filterPatientsAndMedecinsForMonthlyGraph = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Début du mois
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Fin du mois

        // Compter les patients et médecins créés ce mois-ci
        const patients = await User.countDocuments({ 
            role: 'Patient', 
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const medecins = await User.countDocuments({ 
            role: 'Medecin', 
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Réponse en cas de succès
        res.status(200).json({
            success: true,
            message: 'Données mensuelles des patients et médecins récupérées avec succès.',
            data: {
                patients,
                medecins
            }
        });
    } catch (error) {
        // Gestion des erreurs
        console.error('Erreur lors du filtrage des patients et médecins pour le graphique mensuel :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des données mensuelles.',
            error: error.message
        });
    }
};