import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    heure_debut: { type: String, required: true },
    heure_fin: { type: String, required: true },
    specialiste: { type: String, enum: ['Cardiologue', 'Généraliste', 'Pneumologue'], required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel', default: null },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel', required: true }, // Référence à l'ID du médecin
    demandeParticipe: { type: Boolean, default: false },
    statutDemande: { type: String, enum: ['en attente', 'accepté', 'rejeté'], default: 'en attente' }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
