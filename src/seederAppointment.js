import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js'; 
import Appointment from './models/appointment/appointement.js';  
import User from './models/user/userModel.js';
import MedicalRecord from './models/medical/medicalModel.js';  // Nous avons besoin des dossiers médicaux

dotenv.config();
connectDB();

// Fonction pour générer une heure aléatoire dans un certain intervalle
const generateRandomTime = () => {
    const startHour = 8;  // Heure de début (par exemple, 8h du matin)
    const endHour = 17;   // Heure de fin (par exemple, 17h)
    const randomHour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    return `${randomHour}:${randomMinute < 10 ? '0' + randomMinute : randomMinute}`;
};

// Fonction pour générer des rendez-vous
const generateAppointments = async () => {
    try {
        // Vider le modèle des rendez-vous existants
        console.log('Suppression des rendez-vous existants...');
        await Appointment.deleteMany({});

        // Récupérer tous les médecins et patients ayant un dossier médical
        const medecins = await User.find({ role: 'Medecin' });
        const medicalRecords = await MedicalRecord.find();

        if (medecins.length === 0 || medicalRecords.length === 0) {
            console.error('Aucun médecin ou dossier médical trouvé dans la base de données.');
            return;
        }

        console.log(`Nombre de médecins trouvés : ${medecins.length}`);
        console.log(`Nombre de dossiers médicaux trouvés : ${medicalRecords.length}`);

        // Créer des rendez-vous de janvier à juillet 2025
        const months = [
            { month: 1, year: 2025 }, // Janvier
            { month: 2, year: 2025 }, // Février
            { month: 3, year: 2025 }, // Mars
            { month: 4, year: 2025 }, // Avril
            { month: 5, year: 2025 }, // Mai
            { month: 6, year: 2025 }, // Juin
            { month: 7, year: 2025 }, // Juillet
        ];

        for (let i = 0; i < months.length; i++) {
            const { month, year } = months[i];
            const appointmentsPerMonth = Math.floor(Math.random() * 2) + 3; // 3 ou 4 rendez-vous par mois
            const medicalRecordsForMonth = medicalRecords.filter(record => record.medecinId && record.medecinId.toString() === medecins[0]._id.toString());

            // Créer les rendez-vous pour chaque mois
            for (let j = 0; j < appointmentsPerMonth; j++) {
                const randomRecord = medicalRecordsForMonth[Math.floor(Math.random() * medicalRecordsForMonth.length)];
                const patient = await User.findById(randomRecord.patientId);

                if (!patient) {
                    console.error('Patient non trouvé dans le dossier médical.');
                    continue;
                }

                const doctorId = randomRecord.medecinId; // Utiliser l'ID du médecin associé au dossier médical
                const date = new Date(year, month - 1, Math.floor(Math.random() * 28) + 1); // Générer une date aléatoire dans le mois

                const heure_debut = generateRandomTime(); // Heure de début aléatoire
                const heure_fin = generateRandomTime();  // Heure de fin aléatoire

                const newAppointment = new Appointment({
                    date,
                    heure_debut,
                    heure_fin,
                    doctorId,
                    patientId: patient._id,
                    specialiste: 'Cardiologue', // Exemple de spécialité, peut être ajusté
                });

                await newAppointment.save();
                console.log(`Rendez-vous créé : ${newAppointment.date} pour le patient ${patient.nom} ${patient.prenom}`);
            }
        }

        console.log('Seeder des rendez-vous terminé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la création des rendez-vous :', error);
    } finally {
        mongoose.disconnect();
        console.log('Déconnexion de la base de données.');
    }
};

// Exécuter le seeder
generateAppointments();
