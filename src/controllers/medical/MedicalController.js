import MedicalRecord from '../../models/medical/medicalModel.js';
import { validationResult } from 'express-validator';

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

// Récupérer un dossier médical par ID
export const getMedicalRecordById = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { role, id: userId } = req.user;

        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'nom prenom email telephone')
            .populate('medecinId', 'nom prenom email telephone');

        if (!record) {
            return handleErrorResponse(res, 404, 'Dossier médical non trouvé.');
        }

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

        if ((role === 'Medecin' && record.medecinId.toString() !== userId) ||
            (role === 'Patient' && record.patientId.toString() !== userId)) {
            return handleErrorResponse(res, 403, 'Accès refusé : Ce dossier ne vous appartient pas.');
        }

        const medicalUpdates = {};
        if (updates.age !== undefined) medicalUpdates.age = updates.age;
        if (updates.poids !== undefined) medicalUpdates.poids = updates.poids;
        if (updates.groupeSanguin !== undefined) medicalUpdates.groupeSanguin = updates.groupeSanguin;
        if (updates.chirurgie !== undefined) medicalUpdates.chirurgie = updates.chirurgie;
        if (updates.hospitalisation !== undefined) medicalUpdates.hospitalisation = updates.hospitalisation;
        if (updates.antecedentsFamiliaux !== undefined) medicalUpdates.antecedentsFamiliaux = updates.antecedentsFamiliaux;

        const updatedRecord = await MedicalRecord.findByIdAndUpdate(recordId, medicalUpdates, { new: true });

        return res.status(200).json({ success: true, message: 'Dossier médical mis à jour avec succès.', record: updatedRecord });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du dossier médical :", error);
        handleErrorResponse(res, 500, "Erreur lors de la mise à jour du dossier médical.", error.message);
    }
};

// Supprimer un dossier médical par ID
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
};
