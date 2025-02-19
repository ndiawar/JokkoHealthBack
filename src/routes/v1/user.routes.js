import express from 'express';
import UserController from '../../controllers/users/userController.js';
import { getUserProfile, updateUserProfile } from '../../controllers/users/profileController.js';
import PreferencesController from '../../controllers/users/preferencesController.js';
import { userValidationRules } from '../../middlewares/validation/userValidation.js';
import { authenticate } from '../../middlewares/auth/authenticate.js';

const router = express.Router();

// User routes
router.post('/users', userValidationRules, UserController.createUser.bind(UserController));
router.get('/users/:id', authenticate, UserController.getUserById.bind(UserController));
router.put('/users/:id', authenticate, userValidationRules, UserController.updateUser.bind(UserController));
router.delete('/users/:id', authenticate, UserController.deleteUser.bind(UserController));

// Profile routes
router.get('/users/:id/profile', authenticate, getUserProfile);
router.put('/users/:id/profile', authenticate, updateUserProfile);

// Preferences routes
router.get('/users/:id/preferences', authenticate, PreferencesController.getUserPreferences);
router.put('/users/:id/preferences', authenticate, PreferencesController.updateUserPreferences);

export default router;
