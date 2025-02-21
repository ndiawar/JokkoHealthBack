import { body, validationResult } from 'express-validator';

const forgotPassword = [
    body('email')
        .isEmail()
        .withMessage("L'email doit être valide"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const resetPassword = [
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage("Le nouveau mot de passe doit contenir au moins 6 caractères"),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage("La confirmation du mot de passe doit correspondre au nouveau mot de passe"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const changePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage("L'ancien mot de passe est requis"),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage("Le nouveau mot de passe doit contenir au moins 6 caractères"),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage("La confirmation du mot de passe doit correspondre au nouveau mot de passe"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const passwordValidator = {
    forgotPassword,
    resetPassword,
    changePassword
};
