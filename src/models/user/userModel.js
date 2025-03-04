// models/user/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nom: { type: String, required: false, trim: true },
    prenom: { type: String, required: false, trim: true },
    email: { 
        type: String, 
        required: false, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    motDePasse: { 
        type: String, 
        required: false, 
        minlength: 6, 
        default: 'jokkohealth25'
    },
    role: { 
        type: String, 
        enum: ['Patient', 'Medecin', 'SuperAdmin'], 
        required: false 
    },
    dateNaissance: { type: Date },
    sexe: { 
        type: String, 
        enum: ['Homme', 'Femme'] 
    },
    telephone: { 
        type: String, 
        unique: true,
        match: [
          /^(70|75|76|77|78)\d{7}$/, 
          'Numéro de téléphone invalide. Il doit commencer par 70, 75, 76, 77, 78 suivi de 7 chiffres.'
        ]
    },
    username: { type: String, unique: true, required: false },
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

const User = mongoose.model('User', userSchema);
export default User;
