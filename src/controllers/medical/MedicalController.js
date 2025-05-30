import MedicalRecord from '../../models/medical/medicalModel.js';
import { validationResult } from 'express-validator';
import User from '../../models/user/userModel.js';
import mongoose from 'mongoose';
import NotificationService from '../../services/notificationService.js';



// Fonction utilitaire pour gérer les erreurs de manière centralisée
    const handleErrorResponse = (res, statusCode, message, details) => {
        return res.status(statusCode).json({
            success: false,
            message: message,
            error: details || null
        });
    };

    // Fonction utilitaire pour vérifier les rôles
    const checkRole = (role, requiredRole, res) => {
        if (role !== requiredRole) {
            handleErrorResponse(res, 403, `Accès refusé : Seul un ${requiredRole} peut effectuer cette action.`);
            return false;
        }
        return true;
    };

    // Fonction utilitaire pour vérifier l'existence d'un dossier médical
    const findMedicalRecord = async (recordId, res) => {
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            handleErrorResponse(res, 404, 'Dossier médical non trouvé.');
            return null;
        }
        return record;
    };

    // Récupérer tous les dossiers médicaux
    export const getAllMedicalRecords = async (req, res) => {
        try {
            const { role, id: userId } = req.user;


            let records;
            if (role === 'Medecin') {
                // Si l'utilisateur est un médecin, on filtre par `medecinId` et on récupère les infos du patient
                records = await MedicalRecord.find({ medecinId: userId })
                    .populate('patientId', 'nom prenom email telephone')  // Récupérer nom, prénom, téléphone du patient
                    .populate('medecinId', 'nom prenom email telephone'); // Récupérer nom, prénom, email, téléphone du médecin
            } else if (role === 'SuperAdmin') {
                // Si l'utilisateur est un SuperAdmin, on récupère tous les dossiers médicaux
                records = await MedicalRecord.find()
                    .populate('patientId', 'nom prenom email telephone')  // Récupérer nom, prénom, téléphone du patient
                    .populate('medecinId', 'nom prenom email telephone'); // Récupérer nom, prénom, email, téléphone du médecin
            } else if (role === 'Patient') {
                // Si l'utilisateur est un patient, on récupère un seul dossier associé à l'utilisateur
                const record = await MedicalRecord.findOne({ patientId: userId })
                    .populate('patientId', 'nom prenom email telephone')  // Récupérer nom, prénom, téléphone du patient
                    .populate('medecinId', 'nom prenom email telephone'); // Récupérer nom, prénom, email, téléphone du médecin
                
                if (!record) {
                    return handleErrorResponse(res, 404, 'Aucun dossier médical trouvé pour ce patient.');
                }
                return res.status(200).json({ success: true, record });
            }


            if (!records || records.length === 0) {
                return handleErrorResponse(res, 404, 'Aucun dossier médical trouvé.');
            }


            return res.status(200).json({ success: true, records });
        } catch (error) {
            console.error("Erreur lors de la récupération des dossiers médicaux :", error);
            handleErrorResponse(res, 500, "Erreur lors de la récupération des dossiers médicaux.", error.message);
        }
    };

    // Récupérer le dossier médical de l'utilisateur connecté
    export const getMedicalRecordByUser = async (req, res) => {
    try {
        const { role, id: userId } = req.user;


        // Vérifier si l'utilisateur est connecté et récupérer son ID
        const user = await User.findById(userId); // Trouver l'utilisateur via l'ID du token
        if (!user) {
            return handleErrorResponse(res, 401, 'Utilisateur non authentifié.');
        }


        // Vérifier si l'utilisateur est un Patient
        if (role !== 'Patient') {
            return handleErrorResponse(res, 403, 'Accès refusé : Vous devez être un patient pour accéder à votre dossier médical.');
        }


        // Récupérer le dossier médical associé à l'utilisateur connecté
        const record = await MedicalRecord.findOne({ patientId: userId })
            .populate('patientId', 'nom prenom email telephone') // Peupler les informations du patient
            .populate('medecinId', 'nom prenom email telephone'); // Peupler les informations du médecin


        // Vérifier si le dossier médical existe
        if (!record) {
            return handleErrorResponse(res, 404, 'Dossier médical non trouvé.');
        }


        // Retourner le dossier médical
        return res.status(200).json({ success: true, record });
    } catch (error) {
        console.error("Erreur lors de la récupération du dossier médical :", error);
        return handleErrorResponse(res, 500, "Erreur lors de la récupération du dossier médical.", error.message);
    }
    };

    // Modifier un dossier médical par ID
    export const updateMedicalRecord = async (req, res) => {
        try {
            const { recordId } = req.params;
            const updates = req.body;
            const { role, id: userId } = req.user;

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return handleErrorResponse(res, 400, 'Données invalides', errors.array());
            }

            const record = await findMedicalRecord(recordId, res);
            if (!record) return;

            // Vérification des permissions
            if ((role === 'Medecin' && record.medecinId.toString() !== userId) ||
                (role === 'Patient' && record.patientId.toString() !== userId)) {
                return handleErrorResponse(res, 403, 'Accès refusé : Ce dossier ne vous appartient pas.');
            }

            const medicalUpdates = {};
            // Ne pas inclure patientId dans les mises à jour
            if (updates.age !== undefined) medicalUpdates.age = updates.age;
            if (updates.poids !== undefined) medicalUpdates.poids = updates.poids;
            if (updates.groupeSanguin !== undefined) medicalUpdates.groupeSanguin = updates.groupeSanguin;
            if (updates.chirurgie !== undefined) medicalUpdates.chirurgie = updates.chirurgie;
            if (updates.hospitalisation !== undefined) medicalUpdates.hospitalisation = updates.hospitalisation;
            if (updates.antecedentsFamiliaux !== undefined) medicalUpdates.antecedentsFamiliaux = updates.antecedentsFamiliaux;

            // Mettez à jour seulement les champs nécessaires
            const updatedRecord = await MedicalRecord.findByIdAndUpdate(recordId, medicalUpdates, { new: true });

            // Récupérer les informations du médecin et du patient pour les notifications
            const [doctor, patient] = await Promise.all([
                User.findById(record.medecinId),
                User.findById(record.patientId)
            ]);

            // Créer une notification pour le patient
            await NotificationService.createNotification({
                userId: record.patientId,
                title: 'Mise à Jour du Dossier Médical',
                message: `Votre dossier médical a été mis à jour par le Dr. ${doctor.nom} ${doctor.prenom}`,
                type: 'medical',
                priority: 'medium',
                data: {
                    medicalRecordId: recordId,
                    doctorName: `${doctor.nom} ${doctor.prenom}`,
                    updatedFields: Object.keys(medicalUpdates)
                }
            });

            // Créer une notification pour le médecin
            await NotificationService.createNotification({
                userId: record.medecinId,
                title: 'Dossier Médical Mis à Jour',
                message: `Le dossier médical de ${patient.nom} ${patient.prenom} a été mis à jour`,
                type: 'medical',
                priority: 'medium',
                data: {
                    medicalRecordId: recordId,
                    patientName: `${patient.nom} ${patient.prenom}`,
                    updatedFields: Object.keys(medicalUpdates)
                }
            });

            return res.status(200).json({ success: true, message: 'Dossier médical mis à jour avec succès.', record: updatedRecord });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du dossier médical :", error);
            handleErrorResponse(res, 500, "Erreur lors de la mise à jour du dossier médical.", error.message);
        }
    };
    
    // Supprimer un dossier médical
    export const deleteMedicalRecord = async (req, res) => {
        try {
            const { recordId } = req.params;
            const { role, id: userId } = req.user;


            const record = await findMedicalRecord(recordId, res);
            if (!record) return;


            if (!checkRole(role, 'Medecin', res)) return;
            if (record.medecinId.toString() !== userId) {
                return handleErrorResponse(res, 403, 'Accès refusé : Vous ne pouvez pas supprimer ce dossier.');
            }


            await MedicalRecord.findByIdAndDelete(recordId);


            return res.status(200).json({ success: true, message: 'Dossier médical supprimé avec succès.' });
        } catch (error) {
            console.error("Erreur lors de la suppression du dossier médical :", error);
            handleErrorResponse(res, 500, "Erreur lors de la suppression du dossier médical.", error.message);
        }
    }
    // Méthode pour obtenir les statistiques de création de dossiers médicaux par mois pour le médecin connecté
    export const getMedicalRecordsStatsByMonthForMedecin = async (req, res) => {
        try {
            const { role, id: userId } = req.user;
    
            // Vérifier si l'utilisateur est un médecin
            if (role !== 'Medecin') {
                return handleErrorResponse(res, 403, 'Accès refusé : Seuls les médecins peuvent accéder à ces statistiques.');
            }
    
            // Agrégation pour compter les dossiers médicaux créés par mois pour le médecin connecté
            const stats = await MedicalRecord.aggregate([
                {
                    $match: { medecinId: new mongoose.Types.ObjectId(userId) } // Filtrer par l'ID du médecin connecté
                },
                {
                    $project: {
                        createdAt: { $toDate: "$createdAt" } // Convertir `createdAt` en type Date
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" }, // Extraire l'année de création
                            month: { $month: "$createdAt" } // Extraire le mois de création
                        },
                        count: { $sum: 1 } // Compter le nombre de dossiers
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclure l'ID du groupe
                        year: "$_id.year",
                        month: "$_id.month",
                        count: 1 // Inclure le compteur
                    }
                },
                {
                    $sort: { year: 1, month: 1 } // Trier par année et mois
                }
            ]);
    
            if (!stats || stats.length === 0) {
                return handleErrorResponse(res, 404, 'Aucune statistique trouvée pour ce médecin.');
            }
    
            return res.status(200).json({ success: true, stats });
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques :", error);
            handleErrorResponse(res, 500, "Erreur lors de la récupération des statistiques.", error.message);
        }
    };

    /**
    * Récupérer un dossier médical par ID
    */
    export const getMedicalRecordById = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { role, id: userId } = req.user;
        // Vérifier si l'utilisateur est authentifié
        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'nom prenom email telephone')
            .populate('medecinId', 'nom prenom email telephone');
        if (!record) {
            return handleErrorResponse(res, 404, 'Dossier médical non trouvé.');
        }
        // Vérification d'accès selon le rôle de l'utilisateur
        if ((role === 'Medecin' && record.medecinId._id.toString() !== userId) ||
            (role === 'Patient' && record.patientId._id.toString() !== userId)) {
            return handleErrorResponse(res, 403, 'Accès refusé : Ce dossier ne vous appartient pas.');
        }
        return res.status(200).json({ success: true, record });
    } catch (error) {
        console.error("Erreur lors de la récupération du dossier médical :", error);
        handleErrorResponse(res, 500, "Erreur lors de la récupération du dossier médical.", error.message);
    }
    };
    /**
    * Récupérer un dossier médical par patient ID
    */
    export const getMedicalRecordByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { role, id: userId } = req.user;
        // Vérifier si l'utilisateur est authentifié
        const record = await MedicalRecord.findOne({ patientId })
            .populate('patientId', 'nom prenom email telephone')
            .populate('medecinId', 'nom prenom email telephone');
        if (!record) {
            return handleErrorResponse(res, 404, 'Dossier médical non trouvé.');
        }
        // Vérification d'accès selon le rôle de l'utilisateur
        if ((role === 'Medecin' && record.medecinId._id.toString() !== userId) ||
            (role === 'Patient' && record.patientId._id.toString() !== userId)) {
            return handleErrorResponse(res, 403, 'Accès refusé : Ce dossier ne vous appartient pas.');
        }
        return res.status(200).json({ success: true, record });
    } catch (error) {
        console.error("Erreur lors de la récupération du dossier médical par patient ID :", error);
        handleErrorResponse(res, 500, "Erreur lors de la récupération du dossier médical par patient ID.", error.message);
    }
    };

    // Récupérer les derniers dossiers médicaux pour un médecin connecté
    export const getRecentMedicalRecords = async (req, res) => {
        try {
            const { role, id: userId } = req.user;
            const page = parseInt(req.query.page) || 1; // Page actuelle, par défaut à 1
            const limit = 3; // Nombre d'éléments par page
            const skip = (page - 1) * limit; // Calcul de l'offset pour la pagination
    
            // Vérifier si l'utilisateur est un médecin
            if (role !== 'Medecin') {
                return handleErrorResponse(res, 403, 'Accès refusé : Seuls les médecins peuvent accéder à ces dossiers.');
            }
    
            // Récupérer les dossiers médicaux associés au médecin connecté et les trier par date de création
            const records = await MedicalRecord.find({ medecinId: userId })
                .sort({ createdAt: -1 }) // Trier par date de création (les plus récents en premier)
                .skip(skip) // Appliquer le skip pour la pagination
                .limit(limit) // Appliquer la limite pour la pagination
                .populate('patientId', 'nom prenom email telephone') // Récupérer le nom, prénom, téléphone du patient
                .populate('medecinId', 'nom prenom email telephone'); // Récupérer le nom, prénom, email, téléphone du médecin
    
            // Compter le total des dossiers médicaux
            const totalRecords = await MedicalRecord.countDocuments({ medecinId: userId });
    
            const totalPages = Math.ceil(totalRecords / limit); // Calcul du nombre total de pages
    
            if (!records || records.length === 0) {
                return handleErrorResponse(res, 404, 'Aucun dossier médical trouvé pour ce médecin.');
            }
    
            // Renvoyer les dossiers médicaux avec les informations de pagination
            return res.status(200).json({
                success: true,
                records,
                pagination: {
                    totalRecords,
                    totalPages,
                    currentPage: page
                }
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des dossiers médicaux :", error);
            handleErrorResponse(res, 500, "Erreur lors de la récupération des dossiers médicaux.", error.message);
        }
    };
    