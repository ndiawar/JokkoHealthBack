import express from 'express';
import UserController from '../../controllers/users/userController.js';
import { getUserProfile, updateUserProfile } from '../../controllers/users/profileController.js';
import PreferencesController from '../../controllers/users/preferencesController.js';
import { userValidator } from '../../middlewares/validation/userValidation.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();


// 📌 Authentification
router.post('/register', userValidator.register, UserController.register);
router.post('/login', userValidator.login, UserController.login);

// 📌 Gestion des utilisateurs
router.get('/:id', UserController.read.bind(UserController));
router.put('/:id', UserController.updateProfile, UserController.update.bind(UserController));
router.delete('/:id', UserController.delete.bind(UserController));
router.get('/', UserController.list.bind(UserController));

export default router;