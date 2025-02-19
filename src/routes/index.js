import express from 'express';
import authRoutes from './v1/auth.routes.js';
import userRoutes from './v1/user.routes.js';
import healthCheck from './healthCheck.js';

const router = express.Router();

// Health Check Route
router.use('/health', healthCheck);

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;