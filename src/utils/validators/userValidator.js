import { body } from 'express-validator';

const userValidator = {
    register: [
        body('nom').notEmpty().withMessage('Le nom est requis').trim(),
        body('prenom').notEmpty().withMessage('Le prénom est requis').trim(),
        body('email')
            .notEmpty().withMessage('L\'email est requis')
            .isEmail().withMessage('Email invalide')
            .normalizeEmail(),
        body('motDePasse')
            .notEmpty().withMessage('Le mot de passe est requis')
            .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
        body('role')
            .notEmpty().withMessage('Le rôle est requis')
            .isIn(['Patient', 'Médecin', 'SuperAdmin']).withMessage('Rôle invalide'),
        body('telephone')
            .optional()
            .matches(/^\+?\d{8,15}$/).withMessage('Numéro de téléphone invalide'),
        body('dateNaissance')
            .optional()
            .isISO8601().withMessage('Date de naissance invalide'),
    ],

    login: [
        body('email')
            .notEmpty().withMessage('Email requis')
            .isEmail().withMessage('Email invalide'),
        body('motDePasse')
            .notEmpty().withMessage('Mot de passe requis'),
    ],

    updateProfile: [
        body('nom').optional().trim(),
        body('prenom').optional().trim(),
        body('email').optional().isEmail().withMessage('Email invalide').normalizeEmail(),
        body('motDePasse').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
        body('telephone').optional().matches(/^\+?\d{8,15}$/).withMessage('Numéro de téléphone invalide'),
    ],
};

export default userValidator;
