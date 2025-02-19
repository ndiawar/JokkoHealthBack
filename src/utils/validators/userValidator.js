import { body } from 'express-validator';

const userValidator = {
    register: [
        body('username')
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Email is not valid'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],

    login: [
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Email is not valid'),
        body('password')
            .notEmpty().withMessage('Password is required'),
    ],

    updateProfile: [
        body('username')
            .optional()
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email')
            .optional()
            .isEmail().withMessage('Email is not valid'),
    ],
};

export default userValidator;