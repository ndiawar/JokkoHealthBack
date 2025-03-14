import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nom: { type: String, required: false, trim: true },
  prenom: { type: String, required: false, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  motDePasse: {
    type: String,
    required: true,
    minlength: 6,
    default: 'jokkohealth25',
  },
  role: {
    type: String,
    enum: ['Patient', 'Medecin', 'SuperAdmin'],
    required: true,
  },
  dateNaissance: { type: Date },
  sexe: {
    type: String,
    enum: ['Homme', 'Femme'],
  },
  telephone: {
    type: String,
    unique: true,
    required: true,
    match: [
      /^(70|75|76|77|78)\d{7}$/,
      'Numéro de téléphone invalide. Il doit commencer par 70, 75, 76, 77, 78 suivi de 7 chiffres.',
    ],
  },
  username: { type: String, unique: true, required: false },
  imageUrl: { type: String }, // Pour stocker l'URL de l'image
  // Indique si l'utilisateur est bloqué
  blocked: { type: Boolean, default: false },
  // Indique si l'utilisateur est archivé
  archived: { type: Boolean, default: false },
  resetPasswordAttempts: { type: Number, default: 0 },
  lastResetPasswordAttempt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String }, // Champ pour stocker le token de réinitialisation
  resetPasswordExpires: { type: Date }, // Champ pour stocker la date d'expiration du token
  // Ajouter une référence vers le modèle MedicalRecord
  medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
}, { timestamps: true });

// Méthode pour obtenir les nouveaux et anciens patients
userSchema.statics.getPatientCounts = async function() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Mois actuel (0 pour janvier, 1 pour février, etc.)
    const currentYear = currentDate.getFullYear(); // Année actuelle

    // Calculer les nouveaux patients du mois courant (mars)
    const newPatientsCount = await this.countDocuments({
        role: 'Patient',
        createdAt: {
            $gte: new Date(currentYear, currentMonth, 1), // Le premier jour du mois en cours
            $lt: new Date(currentYear, currentMonth + 1, 1) // Avant le premier jour du mois suivant
        }
    });

    // Calculer les anciens patients (patients créés avant le mois courant, ici janvier et février)
    const oldPatientsCount = await this.countDocuments({
        role: 'Patient',
        createdAt: {
            $lt: new Date(currentYear, currentMonth, 1) // Créés avant le premier jour du mois en cours
        }
    });

    return {
        newPatientsCount,
        oldPatientsCount
    };
};



const User = mongoose.model('User', userSchema);
export default User;
