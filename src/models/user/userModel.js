import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nom: 
        { 
            type: String, 
            required: true 
        },
    prenom: 
    { 
            type: String, 
            required: true 
        },
    email: 
        { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true 
        },
    motDePasse: 
        { 
            type: String, 
            required: true 
        },
    role: 
        { 
            type: String, 
            enum: ['Patient', 'Médecin', 'SuperAdmin'], 
            required: true 
        },
    dateNaissance: 
        { 
            type: Date 
        },
    sexe: 
        { 
            type: String 
        },
    telephone: 
        { 
            type: String 
        },
}, { timestamps: true, discriminatorKey: 'role' });

const User = mongoose.model('User', userSchema);
export default User;
