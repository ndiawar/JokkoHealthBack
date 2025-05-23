import express from 'express';
import { 
    getTotalUsersByRole, 
    filterPatients, 
    filterPatientsAndMedecinsForMonthlyGraph 
} from '../../controllers/users/filterUser.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';
import roleCheck from '../../middlewares/auth/roleCheck.js';
import logAction from '../../middlewares/logs/logMiddleware.js';

const router = express.Router();

// Route : Obtenir le total des utilisateurs par rôle
router.get(
    '/total-by-role',
    logAction,
    authenticate,
    roleCheck(['SuperAdmin']),
    getTotalUsersByRole
);

// Route : Filtrer les patients
router.get(
    '/filter-patients',
    logAction,
    authenticate,
    roleCheck(['SuperAdmin', 'Medecin']),
    filterPatients
);

// Route : Filtrer les patients et médecins pour les statistiques mensuelles
router.get(
    '/filter-patients-medecins-monthly',
    logAction,
    filterPatientsAndMedecinsForMonthlyGraph
);

export default router;
