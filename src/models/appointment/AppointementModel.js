// models/Appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    heure_debut: { type: String, required: true }, // Format: "HH:mm"
    heure_fin: { type: String, required: true },   // Format: "HH:mm"
    specialiste: { type: String, enum: ['Cardiologue', 'Généraliste', 'Pneumologue'], required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    demandeParticipe: { type: Boolean, default: false }, // Pour indiquer si le patient a demandé à participer
    statutDemande: { type: String, enum: ['en attente', 'accepté', 'rejeté'], default: 'en attente' } // Statut de la demande
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;