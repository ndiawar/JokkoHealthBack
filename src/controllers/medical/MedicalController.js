// controllers/medicalRecordController.js

import MedicalRecord from '../../models/medical/medicalModel.js';  // Importer le modèle correctement
import User from '../../models/user/userModel.js';  // Importer le modèle correctement

// Créer un dossier médical
export const createMedicalRecord = async (req, res) => {
    try {
        const { patientId, poids, age, groupeSanguin, chirurgie, hospitalisation, antecedentsFamiliaux } = req.body;

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
            groupeSanguin,
            chirurgie,
            hospitalisation,
            antecedentsFamiliaux
        });

        await newRecord.save();

        res.status(201).json({ message: 'Dossier médical créé avec succès.', record: newRecord });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du dossier médical.", details: error.message });
    }
};

// Récupérer tous les dossiers médicaux
export const getAllMedicalRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find().populate('patientId', 'nom prenom telephone');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des dossiers médicaux.", details: error.message });
    }
};

// Récupérer un dossier médical par ID (avec détails patient)
export const getMedicalRecordById = async (req, res) => {
    try {
        const { recordId } = req.params;

        // Récupérer le dossier médical et peupler les informations du patient
        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'nom prenom email telephone');

        if (!record) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération du dossier médical.", details: error.message });
    }
};

export const updateMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updates = req.body;

        console.log("Données de mise à jour reçues :", updates);
        console.log("ID du dossier médical :", recordId);

        // Vérifier si le dossier médical existe
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }

        // Vérifier si le patient existe
        const patient = await User.findById(record.patientId);
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé.' });
        }

        // Préparer les mises à jour pour le dossier médical
        const medicalUpdates = {};
        if (updates.age !== undefined) medicalUpdates.age = updates.age;
        if (updates.poids !== undefined) medicalUpdates.poids = updates.poids;
        if (updates.groupeSanguin !== undefined) medicalUpdates.groupeSanguin = updates.groupeSanguin;
        if (updates.chirurgie !== undefined) medicalUpdates.chirurgie = updates.chirurgie;
        if (updates.hospitalisation !== undefined) medicalUpdates.hospitalisation = updates.hospitalisation;
        if (updates.antecedentsFamiliaux !== undefined) medicalUpdates.antecedentsFamiliaux = updates.antecedentsFamiliaux;

        console.log("Mises à jour médicales :", medicalUpdates);

        // Mettre à jour le dossier médical
        const updatedRecord = await MedicalRecord.findByIdAndUpdate(recordId, medicalUpdates, { new: true });
        console.log("Dossier médical mis à jour :", updatedRecord);

        // Préparer les mises à jour pour le patient
        const patientUpdates = {};
        if (updates.nom !== undefined) patientUpdates.nom = updates.nom;
        if (updates.prenom !== undefined) patientUpdates.prenom = updates.prenom;
        if (updates.email !== undefined) patientUpdates.email = updates.email;

        // Mettre à jour le patient
        if (Object.keys(patientUpdates).length > 0) {
            const updatedPatient = await User.findByIdAndUpdate(record.patientId, patientUpdates, { new: true });
            console.log("Patient mis à jour :", updatedPatient);
        }

        res.status(200).json({ message: 'Dossier médical mis à jour avec succès.', record: updatedRecord });
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour du dossier médical.", details: error });
    }
};


// Supprimer un dossier médical
export const deleteMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        
        // Supprimer le dossier médical par son ID
        const deletedRecord = await MedicalRecord.findByIdAndDelete(recordId);
        
        if (!deletedRecord) {
            return res.status(404).json({ error: 'Dossier médical non trouvé.' });
        }

        res.status(200).json({ message: 'Dossier médical supprimé avec succès.' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression du dossier médical.", details: error.message });
    }
};
