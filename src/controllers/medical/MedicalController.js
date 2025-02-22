// controllers/medicalRecordController.js
import Medical from '../../models/medical/medicalModel.js';  // Importer le modèle correctement

// Créer un dossier médical
export const createMedicalRecord = async (req, res) => {
    try {
        const { nom, prenom, telephone, poids, age, groupeSanguin } = req.body;
        
        // Créer un nouveau dossier médical avec les données fournies
        const newRecord = new Medical({ nom, prenom, telephone, poids, age, groupeSanguin });
        
        // Sauvegarder le dossier médical
        await newRecord.save();
        res.status(201).json({ message: 'Dossier médical créé avec succès.', record: newRecord });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du dossier médical.", details: error.message });
    }
};

// Récupérer tous les dossiers médicaux
export const getAllMedicalRecords = async (req, res) => {
    try {
        // Récupérer tous les dossiers médicaux
        const records = await Medical.find();
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des dossiers médicaux.", details: error.message });
    }
};

// Récupérer un dossier médical par ID
export const getMedicalRecordById = async (req, res) => {
    try {
        const { recordId } = req.params;
        
        // Récupérer un dossier médical spécifique par son ID
        const record = await Medical.findById(recordId);
        
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
