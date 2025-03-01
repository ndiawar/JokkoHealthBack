import mongoose from 'mongoose';
import User from './models/user/userModel.js';  // Assurez-vous que le chemin est correct
import MedicalRecord from './models/medical/medicalModel.js'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js'; // Assurez-vous que le chemin est correct

dotenv.config();  // Charger les variables d'environnement

// Fonction pour générer un nom d'utilisateur unique
const generateUsername = async (prenom, nom) => {
    let username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}`;
    
    // Vérifier si le username existe déjà
    let user = await User.findOne({ username });

    // Si le username existe déjà, ajouter un suffixe numérique pour le rendre unique
    let counter = 1;
    while (user) {
        username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}${counter}`;
        user = await User.findOne({ username });
        counter++;
    }

    return username;
};

// Fonction pour générer des données de patient aléatoires
const generateRandomPatientData = () => {
    const firstNames = ['Amadou', 'Fatoumata', 'Ousmane', 'Mariama', 'Cheikh', 'Aissatou', 'Saliou', 'Aminata', 'Aliou', 'Mame'];
    const lastNames = ['Ndiaye', 'Diallo', 'Fall', 'Ba', 'Thiam', 'Mbaye', 'Faye', 'Touré', 'Sow', 'Gueye'];
    const sexes = ['Homme', 'Femme'];
    const phonePrefixes = ['70', '75', '76', '77', '78'];

    const nom = lastNames[Math.floor(Math.random() * lastNames.length)];
    const prenom = firstNames[Math.floor(Math.random() * firstNames.length)];
    const sexe = sexes[Math.floor(Math.random() * sexes.length)];
    const telephone = `${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${Math.floor(1000000 + Math.random() * 9000000)}`;
    const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.com`;
    const dateNaissance = new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

    return {
        nom,
        prenom,
        email,
        role: 'Patient',  // Attribuer le rôle Patient
        sexe,
        telephone,
        dateNaissance
    };
};

// Fonction pour générer un dossier médical
const generateMedicalRecord = (patientId, medecinId) => {
    return {
        patientId: patientId, // Utilisation du patientId directement
        medecinId: medecinId, // ID du médecin fixe
        age: 30 + Math.floor(Math.random() * 20), // âge aléatoire entre 30 et 50
        poids: 50 + Math.floor(Math.random() * 30), // poids aléatoire entre 50 et 80
        groupeSanguin: ['A+', 'B+', 'AB+', 'O+'][Math.floor(Math.random() * 4)],
        chirurgie: Math.random() > 0.5 ? 'Oui' : 'Non', // aléatoire
        hospitalisation: Math.random() > 0.5 ? 'Oui' : 'Non', // aléatoire
        antecedentsFamiliaux: 'Pas d\'antécédents',
        status: 'stable' // Ajout du statut stable pour chaque patient
    };
};

// Fonction principale de seeding
const seedDatabase = async () => {
    try {
        // Connexion à MongoDB
        await connectDB();

        // Créer un utilisateur SuperAdmin
        const superAdminData = {
            nom: 'Super', 
            prenom: 'Admin', 
            email: 'superadmin@example.com', 
            role: 'SuperAdmin',
            sexe: 'Homme',
            telephone: '701234567',
            dateNaissance: new Date(1985, 5, 15)
        };

        const hashedSuperAdminPassword = await bcrypt.hash('jokkohealth25', 10);  // Utilisation du mot de passe par défaut
        const superAdmin = new User({
            ...superAdminData,
            username: await generateUsername(superAdminData.prenom, superAdminData.nom),
            motDePasse: hashedSuperAdminPassword
        });
        await superAdmin.save();
        console.log('SuperAdmin créé');

        // Créer un utilisateur Medecin
        const medecinData = {
            nom: 'Diallo', 
            prenom: 'Mamadou', 
            email: 'medecin@example.com', 
            role: 'Medecin', 
            sexe: 'Homme', 
            telephone: '771234567', 
            dateNaissance: new Date(1980, 3, 10)
        };

        const hashedMedecinPassword = await bcrypt.hash('jokkohealth25', 10);  // Utilisation du mot de passe par défaut
        const medecin = new User({
            ...medecinData,
            username: await generateUsername(medecinData.prenom, medecinData.nom),
            motDePasse: hashedMedecinPassword
        });
        const savedMedecin = await medecin.save();
        console.log('Médecin créé');

        // Nombre d'utilisateurs patients à générer
        const numberOfUsers = 10;

        // Créer des utilisateurs patients et lier le médecin à leur dossier médical
        for (let i = 0; i < numberOfUsers; i++) {
            const userData = generateRandomPatientData();
            const username = await generateUsername(userData.prenom, userData.nom);

            // Vérifier si l'email ou le téléphone existe déjà
            const existingUser = await User.findOne({ $or: [{ email: userData.email }, { telephone: userData.telephone }] });

            if (!existingUser) {
                // Hacher le mot de passe
                const hashedPassword = await bcrypt.hash('jokkohealth25', 10);

                // Créer un nouvel utilisateur
                const newUser = new User({
                    ...userData,
                    username,
                    motDePasse: hashedPassword
                });

                // Sauvegarder l'utilisateur
                const savedUser = await newUser.save();

                // Créer un dossier médical pour ce patient, en utilisant le savedUser._id comme patientId et l'ID du médecin
                const medicalRecordData = generateMedicalRecord(savedUser._id, savedMedecin._id); // Utilisation du _id du patient comme patientId
                const newMedicalRecord = new MedicalRecord(medicalRecordData);

                // Sauvegarder le dossier médical
                const savedMedicalRecord = await newMedicalRecord.save();

                // Lier le dossier médical à l'utilisateur
                savedUser.medicalRecord = savedMedicalRecord._id;
                await savedUser.save();

                console.log(`Utilisateur créé : ${savedUser.nom} ${savedUser.prenom} avec dossier médical associé.`);
            } else {
                console.log(`Utilisateur existant : ${userData.email}`);
            }
        }

        console.log('Seeding terminé');
        mongoose.disconnect();
    } catch (error) {
        console.error('Erreur lors du seeding:', error);
    }
};

// Lancer le seeding
seedDatabase();
