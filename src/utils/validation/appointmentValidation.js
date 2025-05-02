import { isValidObjectId } from 'mongoose';

export const validateAppointmentTime = (date, heure_debut, heure_fin) => {
    const now = new Date();
    const appointmentDate = new Date(date);
    
    if (appointmentDate < now) {
        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
    }

    const [debutHeures, debutMinutes] = heure_debut.split(':').map(Number);
    const [finHeures, finMinutes] = heure_fin.split(':').map(Number);

    const debutTotal = debutHeures * 60 + debutMinutes;
    const finTotal = finHeures * 60 + finMinutes;

    if (finTotal <= debutTotal) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
    }
};

export const validateAppointmentData = (data) => {
    const requiredFields = ['date', 'heure_debut', 'heure_fin', 'doctorId'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
        throw new Error(`Champs manquants : ${missingFields.join(', ')}`);
    }

    if (!isValidObjectId(data.doctorId)) {
        throw new Error('ID du médecin invalide');
    }

    if (data.patientId && !isValidObjectId(data.patientId)) {
        throw new Error('ID du patient invalide');
    }

    validateAppointmentTime(data.date, data.heure_debut, data.heure_fin);
}; 