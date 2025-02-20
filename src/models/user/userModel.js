import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    motDePasse: { 
        type: String, 
        required: true, 
        minlength: 6, 
        default: 'jokkohealth25'
    },
    role: { 
        type: String, 
        enum: ['Patient', 'Medecin', 'SuperAdmin'], 
        required: true 
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
    username: { type: String, unique: true, required: true }, // Ajout du champ username
        // Autres champs...
        etat: { 
            type: String, 
            enum: ['actif', 'bloqué', 'archivé'], 
            default: 'actif' 
        },
        // Autres champs...
    
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

