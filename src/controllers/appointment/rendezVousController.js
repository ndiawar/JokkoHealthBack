import express from 'express';
import User from '../../models/user/userModel.js';
import MedicalRecord from '../../models/medical/medicalModel.js';
import Appointment from '../../models/appointment/appointement.js';
import mongoose from 'mongoose';
import { AppointmentService } from '../../services/appointmentService.js';
import { AppError } from '../../middlewares/error/errorHandler.js';


const router = express.Router();

// 1. Créer un rendez-vous (par un médecin)
export const createRendezVous = async (req, res, next) => {
    try {
        const { date, heure_debut, heure_fin, specialiste } = req.body;
        const doctorId = req.user._id;

        if (req.user.role !== 'Medecin') {
            throw new AppError('Seuls les médecins peuvent créer des rendez-vous', 403);
        }

        const appointment = await AppointmentService.createAppointment({
            date,
            heure_debut,
            heure_fin,
            specialiste,
            doctorId
        });

        res.status(201).json({ message: 'Rendez-vous créé avec succès', appointment });
    } catch (error) {
        next(error);
    }
};

// 2. Récupérer les rendez-vous disponibles pour un patient (basé sur son médecin)
export const getAvailableAppointments = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const medicalRecord = await MedicalRecord.findOne({ patientId });
        
        if (!medicalRecord) {
            throw new AppError('Dossier médical non trouvé', 404);
        }

        const appointments = await AppointmentService.getAvailableAppointments(medicalRecord.medecinId);
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// 3. Demander à participer à un rendez-vous (par un patient)
export const requestAppointment = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const { patientId } = req.body;

        if (!patientId) {
            throw new AppError('ID du patient manquant', 400);
        }

        const medicalRecord = await MedicalRecord.findOne({ patientId });
        if (!medicalRecord) {
            throw new AppError('Dossier médical non trouvé', 404);
        }

        const appointment = await AppointmentService.requestAppointment(appointmentId, patientId);
        res.status(200).json({ message: 'Demande de participation envoyée', appointment });
    } catch (error) {
        next(error);
    }
};

// 4. Accepter ou rejeter une demande de participation (par un médecin)
export const handleAppointmentRequest = async (req, res, next) => {
    try {
        console.log('Début handleAppointmentRequest:', {
            params: req.params,
            body: req.body,
            user: req.user
        });

        const { appointmentId } = req.params;
        const { statutDemande, patientId } = req.body;

        console.log('Paramètres extraits:', {
            appointmentId,
            statutDemande,
            patientId
        });

        // Vérification des paramètres requis
        if (!appointmentId) {
            throw new AppError('ID de rendez-vous manquant', 400);
        }
        if (!statutDemande) {
            throw new AppError('Statut de demande manquant', 400);
        }
        if (!patientId) {
            throw new AppError('ID de patient manquant', 400);
        }

        // Vérification du rôle de l'utilisateur
        if (req.user.role !== 'Medecin') {
            throw new AppError('Seuls les médecins peuvent gérer les demandes de rendez-vous', 403);
        }

        // Vérification du format du statut
        if (!['accepté', 'refusé'].includes(statutDemande)) {
            throw new AppError('Statut de demande invalide. Doit être "accepté" ou "refusé"', 400);
        }

        console.log('Paramètres validés, appel du service avec:', {
            appointmentId,
            statutDemande,
            patientId
        });

        // Appel au service pour gérer la demande
        const updatedAppointment = await AppointmentService.handleAppointmentRequest(
            appointmentId,
            statutDemande,
            patientId
        );

        console.log('Rendez-vous mis à jour avec succès:', updatedAppointment);

        res.status(200).json({
            message: 'Demande de rendez-vous traitée avec succès',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Erreur dans handleAppointmentRequest:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        next(error);
    }
};


  // 5. Récupérer tous les rendez-vous (pour un médecin ou un patient)
export const getAppointments = async (req, res, next) => {
    try {
        const appointments = await AppointmentService.getAppointmentsByUser(
            req.user._id,
            req.user.role
        );
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// 6. Récupérer les rendez-vous avec une demande de participation en attente
export const getPendingAppointmentRequests = async (req, res, next) => {
    try {
        const appointments = await AppointmentService.getPendingAppointmentRequests(
            req.user._id,
            req.user.role
        );
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// 7. Récupérer les rendez-vous acceptés avec une demande de participation active
export const getAcceptedAppointmentRequests = async (req, res, next) => {
    try {
        const appointments = await AppointmentService.getAcceptedAppointmentRequests(
            req.user._id,
            req.user.role
        );
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};
  
// 8. Récupérer les rendez-vous acceptés pour un patient avec une demande de participation active
export const getAcceptedAppointmentsForPatient = async (req, res, next) => {
    try {
        console.log('Rôle de l\'utilisateur:', req.user.role);
        console.log('ID du patient:', req.user._id);

        if (req.user.role !== 'Patient') {
            throw new AppError('Accès non autorisé. Seul un patient peut accéder à ses rendez-vous.', 403);
        }

        const appointments = await AppointmentService.getAcceptedAppointmentsForPatient(req.user._id);
        console.log('Rendez-vous trouvés:', appointments);
        
        if (appointments.length === 0) {
            console.log('Aucun rendez-vous trouvé pour le patient');
            return res.status(200).json([]); // Retourner un tableau vide au lieu de lancer une erreur
        }

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Erreur dans getAcceptedAppointmentsForPatient:', error);
        next(error);
    }
};

// 9. Récupérer tous les rendez-vous
export const getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await AppointmentService.getAllAppointments();
        
        if (!appointments || appointments.length === 0) {
            throw new AppError('Aucun rendez-vous trouvé.', 404);
        }

        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// Méthode pour obtenir les statistiques de création de rendez-vous par mois pour le médecin connecté
export const getAppointmentsStatsByMonthForMedecin = async (req, res, next) => {
    try {
        if (req.user.role !== 'Medecin') {
            throw new AppError('Accès refusé : Seuls les médecins peuvent accéder à ces statistiques', 403);
        }

        const stats = await AppointmentService.getAppointmentsStatsByMonth(req.user._id);
        
        if (!stats || stats.length === 0) {
            throw new AppError('Aucune statistique trouvée pour ce médecin', 404);
        }

        res.status(200).json({ success: true, stats });
    } catch (error) {
        next(error);
    }
};
