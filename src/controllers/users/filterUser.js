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
        // Récupérer les statistiques pour tous les mois
        const stats = await User.aggregate([
            {
                $match: {
                    role: { $in: ['Patient', 'Medecin'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        role: "$role"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        month: "$_id.month"
                    },
                    patients: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.role", "Patient"] }, "$count", 0]
                        }
                    },
                    medecins: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.role", "Medecin"] }, "$count", 0]
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    patients: 1,
                    medecins: 1
                }
            }
        ]);

        // Réponse en cas de succès
        res.status(200).json({
            success: true,
            message: 'Données mensuelles des patients et médecins récupérées avec succès.',
            data: stats
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