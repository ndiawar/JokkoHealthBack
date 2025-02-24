// controllers/medicalRecordController.js

import MedicalRecord from '../../models/medical/medicalModel.js';  // Importer le modèle correctement
import User from '../../models/user/userModel.js';  // Importer le modèle correctement
import Log from '../../models/historique/logModel.js';

// Créer un dossier médical

export const createMedicalRecord = async (req, res) => {
    try {
        const { patientId, poids, age, groupeSanguin } = req.body;

        // Vérifier si l'utilisateur avec l'ID donné existe et est bien un patient
        const patient = await User.findOne({ _id: patientId, role: 'Patient' });
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé ou non valide.' });
        }

        // Créer un nouveau dossier médical lié à ce patient
        const newRecord = new MedicalRecord({
            patientId,
            poids,
            age,
            groupeSanguin
        });

        await newRecord.save();
                
       // 🔹 Enregistrer l'action dans les logs
        await Log.create({
        userId: req.user._id,
        action: 'Création dossier médical',
        endpoint: req.originalUrl,
        method: req.method,
        requestData: req.body
        });
        res.status(201).json({ message: 'Dossier médical créé avec succès.', record: newRecord });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du dossier médical.", details: error.message });
    }
};

export const getAllMedicalRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find().populate('patientId', 'nom prenom telephone');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des dossiers médicaux.", details: error.message });
    }
};


export const getMedicalRecordById = async (req, res) => {
    try {
        const { recordId } = req.params;

        const record = await MedicalRecord.findById(recordId).populate('patientId', 'nom prenom telephone');
        
        if (!record) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération du dossier médical.", details: error.message });
    }
};

// Mettre à jour un dossier médical
export const updateMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updates = req.body;

        // Mettre à jour le dossier médical avec les nouvelles données
        const updatedRecord = await Medical.findByIdAndUpdate(recordId, updates, { new: true });

        if (!updatedRecord) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier médical mis à jour avec succès.', record: updatedRecord });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la mise à jour du dossier médical.", details: error.message });
    }
};

// Supprimer un dossier médical
export const deleteMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        
        // Supprimer le dossier médical par son ID
        const deletedRecord = await Medical.findByIdAndDelete(recordId);
        
        if (!deletedRecord) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier médical supprimé avec succès.' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression du dossier médical.", details: error.message });
    }

};
