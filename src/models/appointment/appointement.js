import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  heure_debut: {
    type: String,
    required: true,
  },
  heure_fin: {
    type: String,
    required: true,
  },
  specialiste: {
    type: String,
    required: false,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  statutDemande: {
    type: String,
    enum: ['en attente', 'accepté', 'rejeté'],
    default: 'en attente',
  },
  demandeParticipe: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
