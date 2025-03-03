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
        required: false, // Vous pouvez ajouter des spécialités, si nécessaire
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,  // Le médecin qui crée le rendez-vous
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,  // Le patient qui participe au rendez-vous, optionnel au départ
    },
    statutDemande: {
        type: String,
        enum: ['en attente', 'accepté', 'rejeté'],
        default: 'en attente', // Statut initial de la demande de participation
    },
    demandeParticipe: {
        type: Boolean,
        default: false,  // Indique si le patient a demandé à participer
    },
    // Ajoutez d'autres champs nécessaires pour la gestion des rendez-vous
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
