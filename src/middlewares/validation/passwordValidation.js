import { body, validationResult } from 'express-validator';

const forgotPassword = [
    body('email')
        .isEmail()
        .withMessage("L'email doit être valide")
        .normalizeEmail(),
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
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage("Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial"),
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
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage("Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")
        .custom((value, { req }) => value !== req.body.currentPassword)
        .withMessage("Le nouveau mot de passe doit être différent de l'ancien"),
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

const verifyCurrentPassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage("Le mot de passe actuel est requis"),
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
    changePassword,
    verifyCurrentPassword
};
