import Appointment from '../../models/appointment/appointement.js'; // Correction de l'importation
import User from '../../models/user/userModel.js';
import MedicalRecord from '../../models/medical/medicalModel.js';
import mongoose from 'mongoose';

import { validationResult } from 'express-validator';
import moment from 'moment';

class AppointmentController {

    async getAppointmentsForCalendar(req, res) {
        try {
            const { startDate, endDate } = req.query;
    
            // Vérification des dates de début et de fin
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Les dates de début et de fin sont requises.' });
            }
    
            // Validation des dates au format correct
            if (!moment(startDate, "YYYY-MM-DD", true).isValid() || !moment(endDate, "YYYY-MM-DD", true).isValid()) {
                return res.status(400).json({ message: 'Les dates sont mal formatées. Utilisez le format YYYY-MM-DD.' });
            }
    
            // Convertir les dates en format MongoDB
            const start = moment(startDate).startOf('day').toDate();
            const end = moment(endDate).endOf('day').toDate();
    
            // Vérification des valeurs de date après conversion
            console.log('start:', start); 
            console.log('end:', end);
    
            // Rechercher les rendez-vous dans la plage de dates
            const appointments = await Appointment.find({
                date: { $gte: start, $lte: end }
            }).populate('doctorId patientId'); // Vérifier que les ObjectId existent
    
            // Si aucun rendez-vous trouvé
            if (appointments.length === 0) {
                return res.status(404).json({ message: 'Aucun rendez-vous trouvé dans cette plage de dates.' });
            }
    
            // Structurer les rendez-vous pour le calendrier
            const events = appointments.map(appointment => ({
                id: appointment._id,
                title: `Rendez-vous avec ${appointment.specialiste}`,
                start: moment(appointment.date).set('hour', appointment.heure_debut.split(':')[0])
                                                .set('minute', appointment.heure_debut.split(':')[1])
                                                .toDate(),
                end: moment(appointment.date).set('hour', appointment.heure_fin.split(':')[0])
                                            .set('minute', appointment.heure_fin.split(':')[1])
                                            .toDate(),
                specialiste: appointment.specialiste,
                doctorId: appointment.doctorId ? appointment.doctorId._id : null,  // Vérifier si doctorId est présent
                patientId: appointment.patientId ? appointment.patientId._id : null,  // Vérifier si patientId est présent
                statutDemande: appointment.statutDemande,
                demandeParticipe: appointment.demandeParticipe
            }));
    
            res.json(events);
        } catch (error) {
            console.error('Erreur lors de la récupération des rendez-vous:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la récupération des rendez-vous.' });
        }
    }
    
    // Créer un rendez-vous
    async create(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { date, heure_debut, heure_fin, specialiste } = req.body;

            // Vérification du rôle de l'utilisateur
            if (req.user.role !== 'Medecin') {
                return res.status(403).json({ message: 'Seul un médecin peut créer un rendez-vous.' });
            }

            // Vérification de la date
            const appointmentDate = new Date(date);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
            if (appointmentDate < currentDate) {
                return res.status(400).json({ message: 'La date ne peut pas être dans le passé.' });
            }

            // Vérification des heures
            if (heure_debut >= heure_fin) {
                return res.status(400).json({ message: 'L\'heure de fin doit être supérieure à l\'heure de début.' });
            }

            // Vérification des chevauchements d'horaires
            const existingAppointment = await Appointment.findOne({
                doctorId: req.user._id,
                date: appointmentDate,
                $or: [
                    { heure_debut: { $lte: heure_fin } }, 
                    { heure_fin: { $gte: heure_debut } }
                ]
            });

            if (existingAppointment) {
                return res.status(400).json({ message: 'Il y a déjà un rendez-vous à cette heure.' });
            }

            // Création du rendez-vous
            const newAppointment = await Appointment.create({
                date,
                heure_debut,
                heure_fin,
                specialiste,
                doctorId: req.user._id, // Utilisation de l'ID du médecin connecté
            });

            return res.status(201).json(newAppointment);
        } catch (error) {
            console.error('Erreur lors de la création du rendez-vous:', error);
            return res.status(500).json({ error: 'Erreur lors de la création du rendez-vous.' });
        }
    }

    // Demander la participation à un rendez-vous
    async demanderParticipation(req, res) {
        try {
            const { patientId } = req.body;
    
            // Vérification du rôle de l'utilisateur (s'assurer que l'utilisateur est un patient)
            if (req.user.role !== 'Patient') {
                return res.status(403).json({ message: 'Seul un patient peut demander à participer à un rendez-vous.' });
            }
    
            // Récupération du rendez-vous
            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
            }
    
            // Vérification que le patient est un utilisateur existant et qu'il est bien un patient
            const patient = await User.findById(patientId);
            if (!patient || patient.role !== 'Patient') {
                return res.status(400).json({ message: 'L\'utilisateur doit être un patient.' });
            }
    
            // Vérification que la relation médecin-patient existe dans le modèle MedicalRecord
            const relationship = await MedicalRecord.findOne({
                medecinId: appointment.doctorId,
                patientId: patientId
            });
    
            if (!relationship) {
                return res.status(403).json({ message: 'Ce patient n\'est pas lié à ce médecin.' });
            }
    
            // Vérification de la date du rendez-vous
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
            if (new Date(appointment.date) < currentDate) {
                return res.status(400).json({ message: 'La date du rendez-vous ne peut pas être dans le passé.' });
            }
    
            // Vérification que le patient demande à participer à son propre rendez-vous
            if (appointment.patientId && appointment.patientId.toString() !== patientId.toString()) {
                return res.status(400).json({ message: 'Ce rendez-vous appartient à un autre patient.' });
            }
    
            // Enregistrement de la demande de participation
            appointment.demandeParticipe = true;
            appointment.patientId = patientId; // Associer le patient au rendez-vous
            await appointment.save();
    
            return res.status(200).json({ message: 'Demande de participation envoyée avec succès.' });
        } catch (error) {
            console.error('Erreur lors de la demande de participation:', error);
            return res.status(500).json({ error: 'Erreur lors de la demande de participation.' });
        }
    }
    
    // Gérer l'acceptation ou le rejet de la demande
    async gestionDemande(req, res) {
        try {
            const { statutDemande } = req.body; // 'accepté' ou 'rejeté'
            
            // Vérification que le statut est valide
            if (!['accepté', 'rejeté'].includes(statutDemande)) {
                return res.status(400).json({ message: 'Statut de la demande invalide.' });
            }

            // Récupération du rendez-vous par ID
            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
            }

            // Vérification que le médecin est bien celui qui a créé le rendez-vous
            if (appointment.doctorId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Seul le médecin ayant créé ce rendez-vous peut accepter ou rejeter la demande.' });
            }

            // Vérification que la date du rendez-vous n'est pas dans le passé
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour la comparaison
            if (new Date(appointment.date) < currentDate) {
                return res.status(400).json({ message: 'La date du rendez-vous ne peut pas être dans le passé.' });
            }

            // Mise à jour du statut de la demande
            appointment.statutDemande = statutDemande;
            await appointment.save();

            // Retour de la réponse en fonction du statut
            return res.status(200).json({ message: `Demande ${statutDemande} avec succès.` });
            
        } catch (error) {
            console.error('Erreur lors de la gestion de la demande:', error);
            return res.status(500).json({ 
                error: 'Erreur lors de la gestion de la demande.' 
            });
        }
    }

    // Lire un rendez-vous spécifique
    async read(req, res) {
        try {
            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
            }
            return res.status(200).json(appointment);
        } catch (error) {
            console.error('Erreur lors de la récupération du rendez-vous:', error);
            return res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous.' });
        }
    }
    
    // Afficher l'historique des rendez-vous d'un patient
    async getHistoriquePatient(req, res) {
        try {
            const patientAppointments = await Appointment.find({ patientId: req.user._id })
                .populate('doctorId', 'nom specialiste')
                .sort({ date: -1 }); // Tri des rendez-vous du plus récent au plus ancien

            return res.status(200).json(patientAppointments);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique des rendez-vous du patient:', error);
            return res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des rendez-vous.' });
        }
    }

    // Afficher l'historique des rendez-vous d'un médecin
    async getHistoriqueMedecin(req, res) {
        try {
            const doctorAppointments = await Appointment.find({ doctorId: req.user._id })
                .populate('patientId', 'nom prenom')
                .sort({ date: -1 });

            return res.status(200).json(doctorAppointments);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique des rendez-vous du médecin:', error);
            return res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des rendez-vous.' });
        }
    }

    // // Afficher la liste totale des rendez-vous
    // async list(req, res) {
    //     try {
    //         const appointments = await Appointment.find()
    //             .populate('doctorId', 'nom specialiste')
    //             .populate('patientId', 'nom prenom')
    //             .sort({ date: -1 });

    //         return res.status(200).json(appointments);
    //     } catch (error) {
    //         console.error('Erreur lors de la récupération de la liste des rendez-vous:', error);
    //         return res.status(500).json({ error: 'Erreur lors de la récupération de la liste des rendez-vous.' });
    //     }
    // }

    // Afficher la liste des rendez-vous acceptés
    async listAccepted(req, res) {
        try {
            const acceptedAppointments = await Appointment.find({ statutDemande: 'accepté' })
                .populate({
                    path: 'doctorId',
                    select: 'nom specialite -_id',
                    match: { _id: { $exists: true }}
                })
                .populate({
                    path: 'patientId',
                    select: 'nom prenom -_id',
                    match: { _id: { $exists: true }}
                })
                .sort({ date: -1 })
                .lean(); // Conversion en objets JavaScript simples
    
            const filteredAppointments = acceptedAppointments.filter(appointment => 
                appointment.doctorId && appointment.patientId
            );
    
            return res.status(200).json({
                success: true,
                count: filteredAppointments.length,
                data: filteredAppointments
            });
    
        } catch (error) {
            console.error('Erreur détaillée:', {
                message: error.message,
                stack: error.stack,
                query: error.query
            });
    
            return res.status(500).json({
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    userMessage: 'Erreur lors de la récupération des rendez-vous acceptés',
                    developerMessage: process.env.NODE_ENV === 'development' ? 
                        `${error.message} - ${error.stack}` : 
                        'Voir les logs serveur'
                }
            });
        } 
    }
// Lire tous les rendez-vous avec les informations du médecin// Lire tous les rendez-vous avec les informations du médecin
    async list(req, res) {
        try {
            const appointments = await Appointment.find()
                .populate({
                    path: 'doctorId',
                    select: 'nom prenom telephone'
                })
                .populate({
                    path: 'patientId',
                    select: 'nom prenom' // Ajoute ici les infos du patient
                });

            console.log('📅 Rendez-vous trouvés:', appointments);

            if (!appointments || appointments.length === 0) {
                return res.status(404).json({ message: 'Aucun rendez-vous trouvé.' });
            }

            return res.status(200).json(appointments);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
            return res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous.' });
        }
    }

    // Lire un rendez-vous par ID
    async read(req, res) {
        const appointmentId = req.params.id;
        console.log('Appointment ID:', appointmentId); // Log the ID
    
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'ID de rendez-vous invalide.' });
        }
    
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
    }

    // Afficher la liste des rendez-vous refusés
    async listRejected(req, res) {
        try {
            const rejectedAppointments = await Appointment.find({ statutDemande: 'rejeté' })
                .populate({
                    path: 'doctorId',
                    select: 'nom specialite -_id',
                    match: { _id: { $exists: true }} 
                })
                .populate({
                    path: 'patientId',
                    select: 'nom prenom -_id',
                    match: { _id: { $exists: true }}
                })
                .sort({ date: -1 })
                .lean();

            const filteredAppointments = rejectedAppointments.filter(appointment => 
                appointment.doctorId && appointment.patientId
            );

            return res.status(200).json({
                success: true,
                count: filteredAppointments.length,
                data: filteredAppointments
            });

        } catch (error) {
            console.error('Erreur complète:', {
                timestamp: new Date().toISOString(),
                endpoint: req.originalUrl,
                errorDetails: error
            });

            return res.status(500).json({
                success: false,
                error: {
                    code: 'DATABASE_QUERY_FAILURE',
                    userMessage: 'Impossible de récupérer les rendez-vous refusés',
                    systemMessage: process.env.NODE_ENV === 'production' ? 
                        undefined : 
                        `MongoDB Error: ${error.name} - ${error.code}`
                }
            });
        }
    }

    // Afficher les demandes de participation pour les rendez-vous du médecin
    async listParticipationRequests(req, res) {
        try {
            // Vérification du rôle
            if (req.user.role !== 'Medecin') {
                return res.status(403).json({ 
                    success: false,
                    error: 'Accès réservé aux médecins' 
                });
            }

            // Récupération des demandes de participation
            const requests = await Appointment.find({
                doctorId: req.user._id,
                demandeParticipe: true,
                statutDemande: { $in: [null, 'en attente'] }
            })
            .populate({
                path: 'patientId',
                select: 'nom prenom email telephone -_id',
                match: { _id: { $exists: true }} // Assurez-vous que la relation patient existe
            })
            .populate({
                path: 'doctorId',
                select: 'nom specialite -_id',
                match: { _id: { $exists: true }} // Vérification de la relation médecin
            })
            .sort({ createdAt: -1 })
            .lean(); // Utilisation de lean() pour plus de performance

            // Filtrer les demandes qui n'ont pas de patient ou de médecin valide
            const filteredRequests = requests.filter(request => 
                request.patientId && request.doctorId
            );

            // Réponse formatée et envoyée
            return res.status(200).json({
                success: true,
                count: filteredRequests.length,
                data: filteredRequests.map(request => ({
                    ...request,
                    patient: request.patientId,
                    doctor: request.doctorId,
                    patientId: undefined,  // On cache les ID internes
                    doctorId: undefined    // On cache aussi l'ID du médecin
                }))
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des demandes de participation:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_REQUESTS_FAILED',
                    userMessage: 'Erreur lors de la récupération des demandes',
                    technicalMessage: process.env.NODE_ENV === 'development' ? 
                        `${error.name}: ${error.message}` : 
                        undefined
                }
            });
        }
    }

    // Afficher les rendez-vous acceptés pour aujourd'hui
    async listAcceptedAppointmentsToday(req, res) {
        try {
            // Vérification du rôle
            if (req.user.role !== 'Medecin') {
                return res.status(403).json({ 
                    success: false,
                    error: 'Accès réservé aux médecins' 
                });
            }

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0); // Début de la journée à minuit

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999); // Fin de la journée à 23h59m59s

            // Récupération des rendez-vous acceptés aujourd'hui
            const appointments = await Appointment.find({
                doctorId: req.user._id,
                statutDemande: 'accepté',
                demandeParticipe: true,
                date: { $gte: todayStart, $lte: todayEnd } // Seuls les rendez-vous d'aujourd'hui
            })
            .populate({
                path: 'patientId',
                select: 'nom prenom email telephone -_id'
            })
            .populate({
                path: 'doctorId',
                select: 'nom specialite -_id'
            })
            .sort({ date: 1 }) // Tri par date croissante
            .lean(); // Performance optimisée avec lean()

            // Vérification de la validité des données
            const filteredAppointments = appointments.filter(appointment =>
                appointment.patientId && appointment.doctorId
            );

            return res.status(200).json({
                success: true,
                count: filteredAppointments.length,
                data: filteredAppointments.map(appointment => ({
                    ...appointment,
                    patient: appointment.patientId,
                    doctor: appointment.doctorId,
                    patientId: undefined,
                    doctorId: undefined
                }))
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des rendez-vous acceptés aujourd\'hui:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_APPOINTMENTS_FAILED',
                    userMessage: 'Erreur lors de la récupération des rendez-vous acceptés aujourd\'hui.',
                    technicalMessage: process.env.NODE_ENV === 'development' ? 
                        `${error.name}: ${error.message}` : 
                        undefined
                }
            });
        }
    }

    // Afficher les rendez-vous créés par le médecin d'un patient
    async getAppointmentsByDoctor(req, res) {
        try {
            const patientId = req.user._id;

            // Vérification si la relation médecin-patient existe dans le modèle MedicalRecord
            const relationship = await MedicalRecord.findOne({ patientId });

            if (!relationship) {
                return res.status(403).json({ message: 'Ce patient n\'est pas lié à un médecin.' });
            }

            const doctorId = relationship.medecinId;

            const appointments = await Appointment.find({ doctorId })
                .populate('doctorId', 'nom specialiste')
                .populate('patientId', 'nom prenom')
                .sort({ date: -1 });

            return res.status(200).json(appointments);
        } catch (error) {
            console.error('Erreur lors de la récupération des rendez-vous du médecin:', error);
            return res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous du médecin.' });
        }
    }
    // Demander la participation
    // Demander la participation
    async demanderParticipation(req, res) {
        try {
            const { patientId } = req.body;
            const appointmentId = req.params.id;

            // Vérifiez que l'ID est un ObjectId valide
            if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
                return res.status(400).json({ message: 'ID de rendez-vous invalide.' });
            }
            

            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
            }

            // Vérifiez si le patient existe et s'il a le rôle 'Patient'
            const patient = await User.findById(patientId);
            if (!patient || patient.role !== 'Patient') {
                return res.status(400).json({ message: 'L\'utilisateur doit être un patient.' });
            }

            // Enregistrer la demande de participation dans le rendez-vous
            appointment.demandeParticipe = true;
            appointment.patientId = patientId;
            await appointment.save();

            return res.status(200).json({ message: 'Demande de participation envoyée avec succès.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erreur lors de la demande de participation.' });
        }
    }

    // Gérer l'acceptation ou le rejet de la demande
    async gestionDemande(req, res) {
        const { statutDemande } = req.body; // 'accepté' ou 'rejeté'
        const appointmentId = req.params.id;

        // Vérifiez que l'ID est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'ID de rendez-vous invalide.' });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }

        // Vérifiez que le statut est valide
        const validStatuses = ['en attente', 'accepté', 'rejeté'];
        if (!validStatuses.includes(statutDemande)) {
            return res.status(400).json({ message: 'Statut de demande invalide.' });
        }

        appointment.statutDemande = statutDemande;
        await appointment.save();
        return res.status(200).json(appointment);
    }
      // Mettre à jour un rendez-vous
      async update(req, res) {
        const { date, heure_debut, heure_fin } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(req.params.id, { date, heure_debut, heure_fin }, { new: true });
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
        return res.status(200).json(appointment);
    }

    // Supprimer un rendez-vous
    async delete(req, res) {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
        return res.status(204).send();
    }
}

// Exporte la classe
export default new AppointmentController();