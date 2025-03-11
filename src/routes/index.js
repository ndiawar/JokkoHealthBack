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
import filteruserRoutes from './v1/filteruser.route.js';
import rendezvousRoutes from './v1/rendezvous.routes.js';
import SensorRoutes from './v1/sensor.routes.js';
import SensorPoulRoutes from './v1/sensorPoul.routes.js';

const router = express.Router();


console.log(router.stack.map(r => r.route ? r.route.path : r.name));


// Health Check Route
router.use('/health', healthCheck);

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/filteruser', filteruserRoutes);
router.use('/medical', MedicalRoutes);
router.use('/chats', ChatRoutes);
router.use('/messages', MessageRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notifications', NotificationRoutes);
router.use('/medical', MedicalRoutes);
router.use('/logs', logRoutes);
router.use('/rendezvous', rendezvousRoutes);
router.use('/sensors', SensorRoutes);
router.use('/sensorPoul', SensorPoulRoutes);



export default router;