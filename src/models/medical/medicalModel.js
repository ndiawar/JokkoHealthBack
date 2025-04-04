import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null // Référence à l'ID du patient, lié à l'utilisateur
    },
    medecinId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence à l'utilisateur (médecin)
        required: true
    },
    age: {
        type: Number,
        required: false
    },
    poids: { 
        type: Number,
        required: false
    },
    groupeSanguin: {
        type: String,
        required: false
    },
    chirurgie: {  // Ajout des informations sur la chirurgie
        type: String,
        required: false
    },
    hospitalisation: {  // Ajout des informations sur les hospitalisations
        type: String,
        required: false
    },
    antecedentsFamiliaux: {  // Ajout des antécédents familiaux
        type: String,
        required: false
    },
    status: {  // Ajout du champ status
        type: String,
        enum: ['stable', 'en traitement', 'hospitalisé', 'sortie', 'urgent'],  // Valeurs possibles pour le status
        default: 'stable'  // Valeur par défaut
    },
    createdAt: { 
        type: Date, 
        default: Date.now // La date de création est définie par défaut sur la date actuelle
    },
    updatedAt: { 
        type: Date, 
        default: Date.now // La date de mise à jour est définie par défaut sur la date actuelle
    },
}, { timestamps: false }); // Ne pas ajouter de timestamps automatiques (à gérer manuellement dans le seeder)

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
