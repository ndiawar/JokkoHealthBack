// src/middlewares/validation/authValidation.js
import { body } from 'express-validator';

// Définir les validations pour l'enregistrement
const validateRegistration = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères.')
        .trim(),
    body('email')
        .isEmail()
        .withMessage('Veuillez fournir une adresse e-mail valide.')
        .normalizeEmail(),
    body('motDePasse')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères.')
        .trim(),
];

// Définir les validations pour la connexion
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Veuillez fournir une adresse e-mail valide.')
        .normalizeEmail(),
    body('motDePasse')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères.')
        .trim(),
];

// Exporter les deux validations
export { validateRegistration, validateLogin };
