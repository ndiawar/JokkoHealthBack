import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date du rendez-vous doit être dans le futur'
    }
  },
  heure_debut: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Format d\'heure invalide (HH:MM)'
    }
  },
  heure_fin: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Format d\'heure invalide (HH:MM)'
    }
  },
  specialiste: {
    type: String,
    required: false,
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function(value) {
        const User = mongoose.model('User');
        const user = await User.findById(value);
        return user && user.role === 'Medecin';
      },
      message: 'Le médecin spécifié n\'existe pas ou n\'est pas un médecin'
    }
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    validate: {
      validator: async function(value) {
        if (!value) return true;
        const User = mongoose.model('User');
        const user = await User.findById(value);
        return user && user.role === 'Patient';
      },
      message: 'Le patient spécifié n\'existe pas ou n\'est pas un patient'
    }
  },
  statutDemande: {
    type: String,
    enum: ['en attente', 'accepté', 'refusé'],
    default: 'en attente'
  },
  demandeParticipe: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ statutDemande: 1, demandeParticipe: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
