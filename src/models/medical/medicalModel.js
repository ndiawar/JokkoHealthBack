// models/medicalRecordModel.js
import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    prenom: {
        type: String,
        required: true
    },
    telephone: {
        type: String,
        required: true
    },
    poids: {
        type: Number,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    groupeSanguin: {
        type: String,
        required: true
    }
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
