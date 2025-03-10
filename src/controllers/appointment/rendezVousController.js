import express from 'express';
import User from '../../models/user/userModel.js';
import MedicalRecord from '../../models/medical/medicalModel.js';
import Appointment from '../../models/appointment/appointement.js';
import mongoose from 'mongoose';


const router = express.Router();

// 1. Créer un rendez-vous (par un médecin)
export const createRendezVous = async (req, res) => {
    try {
        const { date, heure_debut, heure_fin, specialiste } = req.body;
        const doctorId = req.user._id; // ID du médecin extrait du token JWT

        // Vérifier si l'utilisateur est bien un médecin
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'Medecin') {
            return res.status(403).json({ message: 'Seuls les médecins peuvent créer des rendez-vous' });
        }

        const newAppointment = new Appointment({
            date,
            heure_debut,
            heure_fin,
            specialiste,
            doctorId,
        });

        await newAppointment.save();
        res.status(201).json({ message: 'Rendez-vous créé avec succès', appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du rendez-vous', error: error.message });
    }
};

// 2. Récupérer les rendez-vous disponibles pour un patient (basé sur son médecin)
export const getAvailableAppointments = async (req, res) => {
  try {
    const patientId = req.user._id; // ID du patient extrait du token JWT

    // Trouver le dossier médical du patient pour obtenir l'ID du médecin
    const medicalRecord = await MedicalRecord.findOne({ patientId });
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Dossier médical non trouvé' });
    }

    const doctorId = medicalRecord.medecinId;

    // Trouver les rendez-vous disponibles pour ce médecin
    const appointments = await Appointment.find({
      doctorId,
      patientId: null, // Seuls les rendez-vous sans patient
      statutDemande: 'en attente', // Filtrer par statut "en attente"
      demandeParticipe: false, // Filtrer par demandeParticipe: false
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous', error: error.message });
  }
};

// 3. Demander à participer à un rendez-vous (par un patient)
export const requestAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user._id; // ID du patient extrait du token JWT

        // Vérifier si le patient a un dossier médical avec ce médecin
        const medicalRecord = await MedicalRecord.findOne({ patientId });
        if (!medicalRecord) {
            return res.status(404).json({ message: 'Dossier médical non trouvé' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Vérifier si le rendez-vous est bien géré par le médecin du patient
        if (appointment.doctorId.toString() !== medicalRecord.medecinId.toString()) {
            return res.status(403).json({ message: 'Vous ne pouvez pas demander ce rendez-vous' });
        }

        // Vérifier si le rendez-vous est disponible
        if (appointment.patientId) {
            return res.status(400).json({ message: 'Ce rendez-vous est déjà pris' });
        }

        // Mettre à jour le rendez-vous avec la demande du patient
        appointment.demandeParticipe = true;
        appointment.statutDemande = 'en attente';
        await appointment.save();

        res.status(200).json({ message: 'Demande de participation envoyée', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la demande de participation', error: error.message });
    }
};

// 4. Accepter ou rejeter une demande de participation (par un médecin)
export const handleAppointmentRequest = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { statutDemande } = req.body; // 'accepté' ou 'rejeté'
      const doctorId = req.user._id; // ID du médecin extrait du token JWT
  
      // Vérifier si l'utilisateur est bien un médecin
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== 'Medecin') {
        return res.status(403).json({ message: 'Seuls les médecins peuvent gérer les demandes de rendez-vous' });
      }
  
      // Trouver le rendez-vous
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

      // Vérifier si le rendez-vous a un statut en attente et si la demande de participation est activée
      if (appointment.statutDemande !== 'en attente' || !appointment.demandeParticipe) {
        return res.status(400).json({ message: 'Ce rendez-vous ne peut pas être modifié car la demande n\'est pas en attente ou n\'est pas validée pour participation' });
      }
  
      // Vérifier si le médecin est bien celui qui a créé le rendez-vous
      if (appointment.doctorId.toString() !== doctorId.toString()) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à gérer ce rendez-vous' });
      }
  
      // Mettre à jour le statut de la demande
      appointment.statutDemande = statutDemande;
      if (statutDemande === 'accepté') {
        appointment.patientId = req.body.patientId; // Associer le patient au rendez-vous
      }
  
      await appointment.save();
      res.status(200).json({ message: `Demande ${statutDemande}`, appointment });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la gestion de la demande', error: error.message });
    }
};


  // 5. Récupérer tous les rendez-vous (pour un médecin ou un patient)
export const getAppointments = async (req, res) => {
    try {
      const userId = req.user._id; // ID de l'utilisateur connecté
      const userRole = req.user.role; // Rôle de l'utilisateur connecté
  
      let appointments;
  
      if (userRole === 'Medecin') {
        // Récupérer les rendez-vous créés par ce médecin
        appointments = await Appointment.find({ doctorId: userId })
          .populate('patientId', 'nom prenom') // Récupérer les informations du patient
          .populate('doctorId', 'nom prenom'); // Récupérer les informations du médecin
      } else if (userRole === 'Patient') {
        // Récupérer les rendez-vous associés à ce patient
        appointments = await Appointment.find({ patientId: userId })
          .populate('doctorId', 'nom prenom'); // Récupérer les informations du médecin
      } else {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous', error: error.message });
    }
  };

// 6. Récupérer les rendez-vous avec une demande de participation en attente
export const getPendingAppointmentRequests = async (req, res) => {
    try {
      const userId = req.user._id; // ID de l'utilisateur connecté
      const userRole = req.user.role; // Rôle de l'utilisateur connecté
  
      let appointments;
  
      if (userRole === 'Medecin') {
        // Si l'utilisateur est un médecin, on récupère les rendez-vous pour lesquels une demande de participation est en attente
        appointments = await Appointment.find({
          doctorId: userId,
          statutDemande: 'en attente', // Seulement les rendez-vous où la demande est en attente
          demandeParticipe: true, // Et où la demande de participation est active
        })
          .populate('patientId', 'nom prenom telephone email') // Récupérer les informations du patient : nom, prénom, téléphone, email
          .populate('doctorId', 'nom prenom'); // Récupérer les informations du médecin
      } else if (userRole === 'Patient') {
        // Si l'utilisateur est un patient, on récupère les rendez-vous associés à ce patient et où la demande est en attente
        appointments = await Appointment.find({
          patientId: userId,
          statutDemande: 'en attente', // Seulement les rendez-vous où la demande est en attente
          demandeParticipe: true, // Et où la demande de participation est active
        })
          .populate('doctorId', 'nom prenom'); // Récupérer les informations du médecin
      } else {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous avec demande en attente', error: error.message });
    }
};

// 7. Récupérer les rendez-vous acceptés avec une demande de participation active
export const getAcceptedAppointmentRequests = async (req, res) => {
    try {
      const userId = req.user._id; // ID de l'utilisateur connecté
      const userRole = req.user.role; // Rôle de l'utilisateur connecté
  
      let appointments;
  
      if (userRole === 'Medecin') {
        // Si l'utilisateur est un médecin, on récupère les rendez-vous acceptés et avec une demande de participation active
        appointments = await Appointment.find({
          doctorId: userId,
          statutDemande: 'accepté', // Seulement les rendez-vous où la demande est acceptée
          demandeParticipe: true, // Et où la demande de participation est active
        })
          .populate('patientId', 'nom prenom telephone email dateDeNaissance adresse') // Récupérer toutes les informations du patient
          .populate('doctorId', 'nom prenom') // Récupérer les informations du médecin
          .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe createdAt updatedAt'); // Sélectionner uniquement les champs nécessaires du rendez-vous
      } else if (userRole === 'Patient') {
        // Si l'utilisateur est un patient, on récupère les rendez-vous associés à ce patient et où la demande est acceptée
        appointments = await Appointment.find({
          patientId: userId,
          statutDemande: 'accepté', // Seulement les rendez-vous où la demande est acceptée
          demandeParticipe: true, // Et où la demande de participation est active
        })
          .populate('doctorId', 'nom prenom') // Récupérer les informations du médecin
          .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe createdAt updatedAt'); // Sélectionner uniquement les champs nécessaires du rendez-vous
      } else {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous acceptés', error: error.message });
    }
  };
  
// 8. Récupérer les rendez-vous acceptés pour un patient avec une demande de participation active
export const getAcceptedAppointmentsForPatient = async (req, res) => {
  try {
    const userId = req.user._id;  // Récupérer l'ID du patient à partir du token JWT (req.user)
    const userRole = req.user.role; // Rôle de l'utilisateur connecté

    // Vérification du rôle de l'utilisateur (doit être patient)
    if (userRole !== 'Patient') {
      return res.status(403).json({ message: 'Accès non autorisé. Seul un patient peut accéder à ses rendez-vous.' });
    }

    // Récupérer les rendez-vous acceptés associés à ce patient et où la demande de participation est active
    const appointments = await Appointment.find({
      patientId: userId,  // Utilisation de l'ID du patient récupéré dans le token JWT
      statutDemande: 'accepté',  // Filtrer pour les rendez-vous acceptés
      demandeParticipe: true,    // Filtrer pour les rendez-vous où la demande de participation est active
    })
      .populate('doctorId', 'nom prenom')  // Récupérer les informations du médecin
      .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe createdAt updatedAt'); // Sélectionner les champs nécessaires du rendez-vous

    // Si aucun rendez-vous n'est trouvé
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Aucun rendez-vous accepté trouvé pour ce patient.' });
    }

    res.status(200).json(appointments);  // Renvoyer les rendez-vous acceptés
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous acceptés', error: error.message });
  }
};

// 9. Récupérer tous les rendez-vous
export const getAllAppointments = async (req, res) => {
  try {
      // Récupérer tous les rendez-vous avec les informations du patient et du médecin
      const appointments = await Appointment.find()
          .populate('patientId', 'nom prenom') // Récupérer les informations du patient
          .populate('doctorId', 'nom prenom'); // Récupérer les informations du médecin

      // Vérifier si des rendez-vous ont été trouvés
      if (!appointments || appointments.length === 0) {
          return res.status(404).json({ message: 'Aucun rendez-vous trouvé.' });
      }

      // Retourner les rendez-vous trouvés
      res.status(200).json(appointments);
  } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous', error: error.message });
  }
};
