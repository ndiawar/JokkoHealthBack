import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    motDePasse: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['Patient', 'Médecin', 'SuperAdmin'], required: true },
    dateNaissance: { type: Date },
    sexe: { type: String, enum: ['Homme', 'Femme', 'Autre'] },
    telephone: { type: String, match: [/^\+?\d{8,15}$/, 'Numéro de téléphone invalide'] },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
