// Middleware de vérification de rôle
const roleCheck = (roles = []) => {
    return (req, res, next) => {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        // Vérifier si l'utilisateur a un rôle correspondant
        const userRole = req.user.role; // Le rôle est supposé être attaché à la requête après le middleware d'authentification

        // Si l'utilisateur n'a pas le bon rôle
        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'Accès refusé. Permissions insuffisantes.' });
        }

        // Si l'utilisateur a le bon rôle, on permet d'accéder à la ressource
        next();
    };
};

export default roleCheck;
