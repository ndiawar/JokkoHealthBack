import express from 'express'; // Ajoutez cette ligne pour importer express
import { loginUser } from '../../controllers/auth/loginController.js';
import { registerUser } from '../../controllers/auth/registerController.js';
import { changePassword, resetPassword } from '../../controllers/auth/passwordController.js';
import { validateLogin, validateRegistration } from '../../middlewares/validation/authValidation.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();

// Login route
router.post('/login', validateLogin, loginUser);

// Register route
router.post('/register', validateRegistration, registerUser);

// Password routes
router.post('/password/reset', resetPassword);
router.post('/password/forgot', changePassword);

// Protected routes
router.get('/profile', authenticate, (req, res) => {
    res.send('Profile route');
});

export default router;
