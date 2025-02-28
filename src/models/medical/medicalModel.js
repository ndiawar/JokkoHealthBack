// models/medicalRecordModel.js
import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({

    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Référence à l'ID du patient
    age: {
        type: Number,
        required: true
    },
    poids: {
        type: Number,
        required: true
    },
    groupeSanguin: {
        type: String,
        required: true
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
    }
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
