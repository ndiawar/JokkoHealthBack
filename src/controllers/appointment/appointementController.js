// controllers/appointmentController.js
import Appointment from '../../models/appointment/AppointementModel.js';
import User from '../../models/user/userModel.js';
import mongoose from 'mongoose';

import { validationResult } from 'express-validator';

class AppointmentController {
    // Créer un rendez-vous
   // controllers/appointmentController.js
   async create(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { date, heure_debut, heure_fin, specialiste, doctorId, patientId } = req.body; // Ajout de patientId

        // Vérification de la date
        const appointmentDate = new Date(date);
        if (appointmentDate < new Date()) {
            return res.status(400).json({ message: 'La date ne peut pas être dans le passé.' });
        }

        // Vérification des heures
        if (heure_debut >= heure_fin) {
            return res.status(400).json({ message: 'L\'heure de fin doit être supérieure à l\'heure de début.' });
        }

        const newAppointment = await Appointment.create({ 
            date, 
            heure_debut, 
            heure_fin, 
            specialiste, 
            doctorId,
            patientId // Inclure patientId lors de la création
        });
        
        return res.status(201).json(newAppointment);
    } catch (error) {
        console.error(error); // Affichez l'erreur pour le débogage
        return res.status(500).json({ error: 'Erreur lors de la création du rendez-vous.' });
    }
}   // Lire tous les rendez-vous avec les informations du médecin// Lire tous les rendez-vous avec les informations du médecin
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
// Lister les demandes de participation
 // Lister les demandes de participation
  
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
}

// Exporte la classe
export default new AppointmentController();