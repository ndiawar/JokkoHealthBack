import { isValidObjectId } from 'mongoose';

export const validateAppointmentTime = (date, heure_debut, heure_fin) => {
    const now = new Date();
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
    }

    // Si c'est aujourd'hui, vérifier que l'heure n'est pas passée
    if (appointmentDate.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const [debutHeures, debutMinutes] = heure_debut.split(':').map(Number);

        if (debutHeures < currentHour || (debutHeures === currentHour && debutMinutes <= currentMinutes)) {
            throw new Error('L\'heure de début doit être dans le futur');
        }
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
    const requiredFields = ['date', 'heure_debut', 'heure_fin', 'doctorId', 'specialiste'];
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