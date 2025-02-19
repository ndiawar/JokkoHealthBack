import rateLimit from 'express-rate-limit';

// Limiteur de taux pour limiter le nombre de requêtes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

// Appliquer le limiteur de taux à toutes les requêtes
export default limiter;
