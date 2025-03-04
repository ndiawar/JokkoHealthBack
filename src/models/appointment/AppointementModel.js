import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    date: Date,
    heure_debut: String,
    heure_fin: String,
    specialiste: String,
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    demandeParticipe: { type: Boolean, default: false },
    statutDemande: { type: String, default: 'en attente' }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
