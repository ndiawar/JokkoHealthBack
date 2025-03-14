import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js'; 
import User from './models/user/userModel.js';  
import MedicalRecord from './models/medical/medicalModel.js';

dotenv.config();
connectDB();

// Fonction pour générer une date aléatoire entre janvier et mai 2025
const generateRandomDate = () => {
    const months = [0, 1, 2, 3, 4]; // Janvier (0) à Mai (4)
    const month = months[Math.floor(Math.random() * months.length)]; // Choisir un mois aléatoire dans la plage
    const day = Math.floor(Math.random() * 28) + 1; // Pour éviter de dépasser les jours du mois
    const year = 2025;

    return new Date(year, month, day); // Créer la date avec l'année 2025 et le mois et jour aléatoires
};

// Fonction pour exécuter le seeder
const seedMedicalRecords = async () => {
    try {
        console.log('Début du seeder pour les dossiers médicaux...');

        // Récupérer tous les médecins et patients
        const medecins = await User.find({ role: 'Medecin' });
        const patients = await User.find({ role: 'Patient' });

        if (medecins.length === 0 || patients.length === 0) {
            console.error('Aucun médecin ou patient trouvé dans la base de données.');
            return;
        }

        console.log(`Nombre de médecins trouvés : ${medecins.length}`);
        console.log(`Nombre de patients trouvés : ${patients.length}`);

        // Données de seeder pour les dossiers médicaux
        const medicalRecordsData = patients.map((patient) => {
            // Associer chaque patient à un médecin aléatoire
            const randomMedecin = medecins[Math.floor(Math.random() * medecins.length)];

            // Créer un enregistrement médical avec des dates créées et mises à jour aléatoires
            return {
                patientId: patient._id,
                medecinId: randomMedecin._id,
                age: Math.floor(Math.random() * 60) + 18, // Âge aléatoire entre 18 et 77
                poids: Math.floor(Math.random() * 100) + 50, // Poids aléatoire entre 50 et 150 kg
                groupeSanguin: ['A+', 'B+', 'AB+', 'O+'][Math.floor(Math.random() * 4)], // Groupe sanguin aléatoire
                chirurgie: Math.random() > 0.5 ? 'Oui' : 'Non', // Chirurgie aléatoire
                hospitalisation: ['Cardiologue', 'Pneumonie', 'Tension'][Math.floor(Math.random() * 3)], // Hospitalisation aléatoire
                antecedentsFamiliaux: 'Pas d\'antécédents', // Antécédents familiaux par défaut
                status: ['stable', 'en traitement', 'urgent'][Math.floor(Math.random() * 3)], // Statut aléatoire
                createdAt: generateRandomDate(), // Date de création dans la période de janvier à mai 2025
                updatedAt: generateRandomDate(), // Date de mise à jour dans la période de janvier à mai 2025
            };
        });

        console.log('Suppression des dossiers médicaux existants...');
        // Supprimer les dossiers médicaux existants (optionnel)
        await MedicalRecord.deleteMany({});

        console.log('Insertion des nouveaux dossiers médicaux...');
        // Insérer les nouveaux dossiers médicaux
        await MedicalRecord.insertMany(medicalRecordsData);

        console.log('Seeder exécuté avec succès : Dossiers médicaux créés.');
    } catch (error) {
        console.error('Erreur lors de l\'exécution du seeder :', error);
    } finally {
        // Déconnexion de la base de données
        mongoose.disconnect();
        console.log('Déconnexion de la base de données.');
    }
};

// Exécuter le seeder
seedMedicalRecords();
