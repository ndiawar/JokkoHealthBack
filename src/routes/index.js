import express from 'express';
import authRoutes from './v1/auth.routes.js';
import userRoutes from './v1/user.routes.js';
import healthCheck from './healthCheck.js';
import ChatRoutes from './v1/chat.routes.js';
import MessageRoutes from './v1/message.routes.js';
import appointmentRoutes from './v1/appointment.routes.js';
import NotificationRoutes from './v1/notification.routes.js';
import MedicalRoutes from './v1/medical.routes.js';
import logRoutes from './v1/log.routes.js';

const router = express.Router();
console.log(router.stack.map(r => r.route ? r.route.path : r.name));


// Health Check Route
router.use('/health', healthCheck);

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chats', ChatRoutes);
router.use('/messages', MessageRoutes);
router.use('/appointment', appointmentRoutes);
router.use('/notifications', NotificationRoutes);
router.use('/medical', MedicalRoutes);
router.use('/logs', logRoutes);


export default router;