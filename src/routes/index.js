import express from 'express';
import authRoutes from './v1/auth.routes.js';
import userRoutes from './v1/user.routes.js';
import healthCheck from './healthCheck.js';
import appointmentRoutes from './v1/appointment.routes.js';

const router = express.Router();
console.log(router.stack.map(r => r.route ? r.route.path : r.name));


// Health Check Route
router.use('/health', healthCheck);

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/appointment', appointmentRoutes);

export default router;