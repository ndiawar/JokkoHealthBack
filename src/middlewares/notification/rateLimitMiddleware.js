import NotificationMetricsService from '../../services/notificationMetricsService.js';
import { AppError } from '../error/errorHandler.js';

export const notificationRateLimit = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const canProceed = await NotificationMetricsService.checkRateLimit(userId);

        if (!canProceed) {
            throw new AppError('Limite de notifications atteinte. Veuillez réessayer plus tard.', 429);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const validateNotificationData = (req, res, next) => {
    const validation = NotificationMetricsService.validateNotificationData(req.body);
    
    if (!validation.isValid) {
        return res.status(400).json({
            status: 'error',
            message: 'Données de notification invalides',
            errors: validation.errors
        });
    }

    next();
}; 