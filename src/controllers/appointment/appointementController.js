// controllers/appointmentController.js
import Appointment from '../../models/appointment/AppointementModel.js';
import User from '../../models/user/userModel.js';

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

        const { date, heure_debut, heure_fin, specialiste } = req.body;

        // Vérification de la date
        const appointmentDate = new Date(date);
        if (appointmentDate < new Date()) {
            return res.status(400).json({ message: 'La date ne peut pas être dans le passé.' });
        }

        // Vérification des heures
        if (heure_debut >= heure_fin) {
            return res.status(400).json({ message: 'L\'heure de fin doit être supérieure à l\'heure de début.' });
        }

        const newAppointment = await Appointment.create({ date, heure_debut, heure_fin, specialiste });
        return res.status(201).json(newAppointment);
    } catch (error) {
        return res.status(500).json({ error: 'Erreur lors de la création du rendez-vous.' });
    }
}

// Lire tous les rendez-vous
    async list(req, res) {
        const appointments = await Appointment.find();
        return res.status(200).json(appointments);
    }

    // Lire un rendez-vous par ID
    async read(req, res) {
        const appointment = await Appointment.findById(req.params.id);
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
        const appointment = await Appointment.findById(req.params.id);
    
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }

        // Vérifiez si le patient existe et s'il a le rôle 'Patient'
        const patient = await User.findById(patientId);
        console.log(patient);  // Ajoutez ceci pour vérifier l'utilisateur retourné

        if (!patient || patient.role !== 'Patient') {
            return res.status(400).json({ message: 'L\'utilisateur doit être un patient.' });
        }
    
        // Enregistrer la demande de participation dans le rendez-vous
        appointment.demandeParticipe = true; // Mettre à jour la demande de participation
        appointment.patientId = patientId;   // Ajouter le patientId
        await appointment.save();
    
        return res.status(200).json({ message: 'Demande de participation envoyée avec succès.' });
    } catch (error) {
        console.error(error);  // Affichez l'erreur pour un débogage plus facile
        return res.status(500).json({ error: 'Erreur lors de la demande de participation.' });
    }
}

    
// Gérer l'acceptation ou le rejet de la demande
async gestionDemande(req, res) {
    const { statutDemande } = req.body; // 'accepté' ou 'rejeté'
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    appointment.statutDemande = statutDemande;
    await appointment.save();
    return res.status(200).json(appointment);
}
}

// Exporte la classe
export default new AppointmentController();