import express from 'express';
import User from '../../models/user/userModel.js';
import MedicalRecord from '../../models/medical/medicalModel.js';
import Appointment from '../../models/appointment/appointement.js';
import mongoose from 'mongoose';
import { AppointmentService } from '../../services/appointmentService.js';
import { AppError } from '../../middlewares/error/errorHandler.js';
import NotificationService from '../../services/notificationService.js';


const router = express.Router();

// 1. Créer un rendez-vous (par un médecin)
export const createRendezVous = async (req, res, next) => {
    try {
        console.log('Début de la création du rendez-vous');
        console.log('Données reçues:', req.body);
        
        const { date, heure_debut, heure_fin, specialiste } = req.body;
        const doctorId = req.user._id;

        if (!date || !heure_debut || !heure_fin || !specialiste) {
            console.log('Données manquantes:', { date, heure_debut, heure_fin, specialiste });
            throw new AppError('Tous les champs sont requis', 400);
        }

        if (req.user.role !== 'Medecin') {
            throw new AppError('Seuls les médecins peuvent créer des rendez-vous', 403);
        }

        // Validation de la date et de l'heure
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Date sélectionnée:', selectedDate);
        console.log('Date aujourd\'hui:', today);

        // Si la date est aujourd'hui, vérifier que l'heure n'est pas passée
        if (selectedDate.getTime() === today.getTime()) {
            const currentHour = new Date().getHours();
            const currentMinutes = new Date().getMinutes();
            const [debutHeures, debutMinutes] = heure_debut.split(':').map(Number);

            console.log('Heures actuelles:', { currentHour, currentMinutes });
            console.log('Heures de début:', { debutHeures, debutMinutes });

            if (debutHeures < currentHour || (debutHeures === currentHour && debutMinutes <= currentMinutes)) {
                throw new AppError('L\'heure de début doit être dans le futur', 400);
            }
        } else if (selectedDate < today) {
            throw new AppError('La date doit être dans le futur', 400);
        }

        // Validation des heures de début et de fin
        const [debutHeures, debutMinutes] = heure_debut.split(':').map(Number);
        const [finHeures, finMinutes] = heure_fin.split(':').map(Number);

        console.log('Validation des heures:', {
            debutHeures,
            debutMinutes,
            finHeures,
            finMinutes
        });

        if (finHeures < debutHeures || (finHeures === debutHeures && finMinutes <= debutMinutes)) {
            throw new AppError('L\'heure de fin doit être après l\'heure de début', 400);
        }

        console.log('Création du rendez-vous avec les données:', {
            date,
            heure_debut,
            heure_fin,
            specialiste,
            doctorId
        });

        // Créer le rendez-vous
        const appointment = await AppointmentService.createAppointment({
            date,
            heure_debut,
            heure_fin,
            specialiste,
            doctorId
        });

        console.log('Rendez-vous créé avec succès:', appointment);

        // Récupérer tous les patients du médecin via les dossiers médicaux
        const medicalRecords = await MedicalRecord.find({ medecinId: doctorId });
        console.log('Nombre de dossiers médicaux trouvés:', medicalRecords.length);
        
        // Créer une notification pour chaque patient
        for (const record of medicalRecords) {
            try {
                await NotificationService.createNotification({
                    userId: record.patientId,
                    title: 'Nouveau Rendez-vous Disponible',
                    message: `Le Dr. ${req.user.nom} ${req.user.prenom} a créé un nouveau rendez-vous le ${date} à ${heure_debut} pour ${specialiste}`,
                    type: 'appointment',
                    priority: 'medium',
                    data: {
                        appointmentId: appointment._id,
                        doctorId: doctorId,
                        doctorName: `${req.user.nom} ${req.user.prenom}`,
                        date,
                        heure_debut,
                        specialiste
                    }
                });
            } catch (error) {
                console.error('Erreur lors de la création de la notification pour le patient:', error);
                // Continuer avec les autres notifications même si une échoue
            }
        }

        // Récupérer tous les SuperAdmin pour notification
        const superAdmins = await User.find({ role: 'SuperAdmin' });
        console.log('Nombre de SuperAdmin trouvés:', superAdmins.length);
        
        // Créer une notification pour chaque SuperAdmin
        for (const superAdmin of superAdmins) {
            try {
                await NotificationService.createNotification({
                    userId: superAdmin._id,
                    title: 'Nouveau Rendez-vous Créé',
                    message: `Le Dr. ${req.user.nom} ${req.user.prenom} a créé un nouveau rendez-vous pour le ${date} à ${heure_debut}`,
                    type: 'appointment',
                    priority: 'low',
                    data: {
                        appointmentId: appointment._id,
                        doctorId: doctorId,
                        doctorName: `${req.user.nom} ${req.user.prenom}`,
                        date,
                        heure_debut
                    }
                });
            } catch (error) {
                console.error('Erreur lors de la création de la notification pour le SuperAdmin:', error);
                // Continuer avec les autres notifications même si une échoue
            }
        }

        res.status(201).json({ message: 'Rendez-vous créé avec succès', appointment });
    } catch (error) {
        console.error('Erreur lors de la création du rendez-vous:', error);
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
        const patientId = req.user._id;

        if (req.user.role !== 'Patient') {
            throw new AppError('Seuls les patients peuvent demander à participer à un rendez-vous', 403);
        }

        const medicalRecord = await MedicalRecord.findOne({ patientId });
        if (!medicalRecord) {
            throw new AppError('Dossier médical non trouvé', 404);
        }

        const appointment = await AppointmentService.requestAppointment(appointmentId, patientId);

        // Créer une notification pour le médecin
        await NotificationService.createNotification({
            userId: appointment.doctorId,
            title: 'Nouvelle Demande de Rendez-vous',
            message: `Le patient ${req.user.nom} ${req.user.prenom} souhaite participer à votre rendez-vous du ${appointment.date} à ${appointment.heure_debut}`,
            type: 'appointment',
            priority: 'medium',
            data: {
                appointmentId: appointment._id,
                patientId: patientId,
                patientName: `${req.user.nom} ${req.user.prenom}`,
                date: appointment.date,
                heure_debut: appointment.heure_debut
            },
            isRead: false,
            readAt: null,
            reminderSent: false,
            reminderCount: 0,
            lastReminderSent: null,
            groupId: null,
            groupType: null
        });

        res.status(200).json({ message: 'Demande de participation envoyée', appointment });
    } catch (error) {
        next(error);
    }
};

// 4. Accepter ou rejeter une demande de participation (par un médecin)
export const handleAppointmentRequest = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const { statutDemande, patientId } = req.body;

        if (!appointmentId || !statutDemande || !patientId) {
            throw new AppError('Paramètres manquants', 400);
        }

        if (req.user.role !== 'Medecin') {
            throw new AppError('Seuls les médecins peuvent gérer les demandes de rendez-vous', 403);
        }

        if (!['accepté', 'refusé'].includes(statutDemande)) {
            throw new AppError('Statut de demande invalide', 400);
        }

        const updatedAppointment = await AppointmentService.handleAppointmentRequest(
            appointmentId,
            statutDemande,
            patientId
        );

        // Récupérer les informations du patient
        const patient = await User.findById(patientId);
        if (!patient) {
            throw new AppError('Patient non trouvé', 404);
        }

        // Créer une notification pour le patient
        await NotificationService.createNotification({
            userId: patientId,
            title: `Réponse à votre demande de rendez-vous`,
            message: `Le Dr. ${req.user.nom} ${req.user.prenom} a ${statutDemande} votre demande de rendez-vous du ${updatedAppointment.date} à ${updatedAppointment.heure_debut}`,
            type: 'appointment',
            priority: 'high',
            data: {
                appointmentId: updatedAppointment._id,
                doctorId: req.user._id,
                doctorName: `${req.user.nom} ${req.user.prenom}`,
                date: updatedAppointment.date,
                heure_debut: updatedAppointment.heure_debut,
                status: statutDemande
            },
            isRead: false,
            readAt: null,
            reminderSent: false,
            reminderCount: 0,
            lastReminderSent: null,
            groupId: null,
            groupType: null
        });

        res.status(200).json({
            message: 'Demande de rendez-vous traitée avec succès',
            appointment: updatedAppointment
        });
    } catch (error) {
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
