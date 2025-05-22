import Appointment from '../models/appointment/appointement.js';
import { validateAppointmentData } from '../utils/validation/appointmentValidation.js';
import mongoose from 'mongoose';

export class AppointmentService {
    static async createAppointment(data) {
        validateAppointmentData(data);
        return await Appointment.create(data);
    }

    static async getAvailableAppointments(doctorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await Appointment.find({
            doctorId,
            patientId: null,
            statutDemande: 'en attente',
            demandeParticipe: false,
            date: { $gte: today }
        }).select('date heure_debut heure_fin specialiste').lean();
    }

    static async requestAppointment(appointmentId, patientId) {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new Error('Rendez-vous non trouvé');
        }

        if (appointment.patientId) {
            throw new Error('Ce rendez-vous est déjà pris');
        }

        if (appointment.demandeParticipe) {
            throw new Error('Une demande de participation est déjà en cours pour ce rendez-vous');
        }

        appointment.demandeParticipe = true;
        appointment.statutDemande = 'en attente';
        appointment.patientId = patientId;
        return await appointment.save();
    }

    static async handleAppointmentRequest(appointmentId, status, patientId) {
        console.log('Début handleAppointmentRequest dans le service:', { appointmentId, status, patientId });
        
        try {
            // Vérification de la validité des IDs
            if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
                throw new Error('ID de rendez-vous invalide');
            }
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                throw new Error('ID de patient invalide');
            }

            // Convertir les IDs en ObjectId
            const appointmentObjectId = new mongoose.Types.ObjectId(appointmentId);
            const patientObjectId = new mongoose.Types.ObjectId(patientId);

            console.log('IDs convertis en ObjectId:', {
                appointmentObjectId: appointmentObjectId.toString(),
                patientObjectId: patientObjectId.toString()
            });

            // Vérifier que le patient existe et est bien un patient
            const patient = await mongoose.model('User').findById(patientObjectId);
            console.log('Patient trouvé:', patient ? {
                id: patient._id,
                role: patient.role
            } : 'Patient non trouvé');

            if (!patient) {
                throw new Error('Le patient spécifié n\'existe pas');
            }
            if (patient.role !== 'Patient') {
                throw new Error('L\'utilisateur spécifié n\'est pas un patient');
            }

            // Rechercher le rendez-vous
            const appointment = await Appointment.findById(appointmentObjectId);
            console.log('Rendez-vous trouvé:', appointment ? {
                id: appointment._id,
                patientId: appointment.patientId,
                demandeParticipe: appointment.demandeParticipe,
                statutDemande: appointment.statutDemande
            } : 'Rendez-vous non trouvé');

            if (!appointment) {
                throw new Error('Rendez-vous non trouvé');
            }

            if (!appointment.demandeParticipe) {
                throw new Error('Ce rendez-vous n\'a pas de demande de participation active');
            }

            // Convertir l'ID du patient stocké en string pour la comparaison
            const currentPatientId = appointment.patientId ? appointment.patientId.toString() : null;
            console.log('Comparaison des IDs:', { 
                currentPatientId, 
                requestPatientId: patientObjectId.toString() 
            });

            if (currentPatientId && currentPatientId !== patientObjectId.toString()) {
                throw new Error('Ce rendez-vous est déjà attribué à un autre patient');
            }

            // Vérifier que le statut est valide
            if (!['accepté', 'refusé'].includes(status)) {
                throw new Error('Statut de demande invalide');
            }

            // Mettre à jour le rendez-vous
            appointment.statutDemande = status;
            if (status === 'accepté') {
                appointment.patientId = patientObjectId;
            } else {
                appointment.demandeParticipe = false;
                appointment.patientId = null;
            }

            console.log('Sauvegarde du rendez-vous avec les modifications:', {
                patientId: appointment.patientId,
                statutDemande: appointment.statutDemande,
                demandeParticipe: appointment.demandeParticipe
            });

            try {
                const savedAppointment = await appointment.save();
                console.log('Rendez-vous sauvegardé avec succès:', {
                    id: savedAppointment._id,
                    patientId: savedAppointment.patientId,
                    statutDemande: savedAppointment.statutDemande,
                    demandeParticipe: savedAppointment.demandeParticipe
                });
                return savedAppointment;
            } catch (saveError) {
                console.error('Erreur lors de la sauvegarde:', {
                    message: saveError.message,
                    errors: saveError.errors
                });
                if (saveError.name === 'ValidationError') {
                    throw new Error('Erreur de validation: ' + Object.values(saveError.errors).map(err => err.message).join(', '));
                }
                throw saveError;
            }
        } catch (error) {
            console.error('Erreur dans handleAppointmentRequest du service:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    static async getAppointmentsByUser(userId, role) {
        const query = role === 'Medecin' 
            ? { doctorId: userId }
            : { patientId: userId };

        return await Appointment.find(query)
            .populate('patientId', 'nom prenom')
            .populate('doctorId', 'nom prenom')
            .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe')
            .lean();
    }

    static async getAppointmentsStatsByMonth(doctorId) {
        return await Appointment.aggregate([
            { $match: { doctorId: doctorId } },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    count: 1
                }
            },
            { $sort: { year: 1, month: 1 } }
        ]);
    }

    static async getPendingAppointmentRequests(userId, role) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const query = role === 'Medecin' 
            ? { 
                doctorId: userId, 
                statutDemande: 'en attente',
                date: { $gte: today },
                $or: [
                    { demandeParticipe: true },
                    { patientId: { $exists: true, $ne: null } }
                ]
            }
            : { 
                patientId: userId, 
                statutDemande: 'en attente',
                date: { $gte: today },
                demandeParticipe: true 
            };

        return await Appointment.find(query)
            .populate({
                path: 'patientId',
                select: 'nom prenom telephone email dateDeNaissance adresse',
                match: { _id: { $exists: true } }
            })
            .populate('doctorId', 'nom prenom')
            .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe')
            .sort({ date: 1, heure_debut: 1 })
            .lean();
    }

    static async getAcceptedAppointmentRequests(userId, role) {
        const query = role === 'Medecin' 
            ? { doctorId: userId, statutDemande: 'accepté', demandeParticipe: true }
            : { patientId: userId, statutDemande: 'accepté', demandeParticipe: true };

        return await Appointment.find(query)
            .populate('patientId', 'nom prenom telephone email dateDeNaissance adresse')
            .populate('doctorId', 'nom prenom')
            .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe createdAt updatedAt')
            .lean();
    }

    static async getAcceptedAppointmentsForPatient(patientId) {
        return await Appointment.find({
            patientId,
            statutDemande: 'accepté',
            demandeParticipe: true
        })
            .populate('doctorId', 'nom prenom')
            .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe createdAt updatedAt')
            .lean();
    }

    static async getAllAppointments() {
        return await Appointment.find()
            .populate('patientId', 'nom prenom')
            .populate('doctorId', 'nom prenom')
            .select('date heure_debut heure_fin specialiste statutDemande demandeParticipe')
            .lean();
    }
} 