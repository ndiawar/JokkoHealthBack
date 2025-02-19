import { body, validationResult } from 'express-validator';

const userValidationRules = () => {
    return [
        body('username')
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Email is not valid'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('preferences')
            .optional()
            .isObject().withMessage('Preferences must be an object'),
    ];
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export { userValidationRules, validate };
