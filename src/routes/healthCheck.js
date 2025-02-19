import express from 'express';
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is up and running' });
});

export default router;