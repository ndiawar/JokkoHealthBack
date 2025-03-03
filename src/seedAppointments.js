import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js'; //
import User from './models/user/userModel.js';  // Assurez-vous que le chemin relatif est correct
import Appointment from './models/appointment/appointement.js';
import MedicalRecord from './models/medical/medicalModel.js';


dotenv.config();
connectDB();

const seedAppointments = async () => {
  try {
    // Supprimer les anciens rendez-vous pour recommencer à zéro
    await Appointment.deleteMany();

    // Récupérer tous les utilisateurs (médecins et patients)
    const doctors = await User.find({ role: 'Medecin' });
    const patients = await User.find({ role: 'Patient' });

    // Récupérer tous les dossiers médicaux
    const medicalRecords = await MedicalRecord.find();

    const appointments = [];

    // Créer des rendez-vous pour chaque dossier médical
    medicalRecords.forEach(record => {
      const doctor = doctors.find(doc => doc._id.toString() === record.medecinId.toString());
      const patient = patients.find(pat => pat._id.toString() === record.patientId.toString());

      for (let i = 0; i < 5; i++) {
        // Créer des rendez-vous avec des dates aléatoires
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30)); // Date dans les 30 prochains jours

        // Générer l'heure du rendez-vous (entre 8h et 16h)
        const heureDebut = `${Math.floor(Math.random() * 9) + 8}:00`;
        const heureFin = `${parseInt(heureDebut.split(':')[0]) + 1}:00`; // Heure de fin une heure après

        // Simuler des demandes de participation (50% en attente, 25% acceptées, 25% rejetées)
        const statutDemande = Math.random() < 0.5 ? 'en attente' : Math.random() < 0.75 ? 'accepté' : 'rejeté';

        // Créer un rendez-vous avec une demande de participation
        const newAppointment = {
          date: appointmentDate,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          specialiste: 'Généraliste',  // Utiliser une spécialité par défaut, modifiable si nécessaire
          doctorId: doctor._id,
          patientId: patient ? patient._id : null, // On peut ne pas associer de patient pour certains rendez-vous
          statutDemande,
          demandeParticipe: statutDemande === 'en attente',  // Si le statut est "en attente", la demande de participation est activée
        };

        // Ajouter au tableau des rendez-vous
        appointments.push(newAppointment);
      }
    });

    // Insérer les rendez-vous dans la base de données
    await Appointment.insertMany(appointments);

    console.log('Rendez-vous générés avec succès!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur lors de la génération des rendez-vous:', error);
    mongoose.disconnect();
  }
};

seedAppointments();
