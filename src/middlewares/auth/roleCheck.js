// Middleware de vérification de rôle
const roleCheck = (roles = []) => {
    return (req, res, next) => {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        // Vérification du statut de l'utilisateur
        if (req.user.blocked) {
            return res.status(403).json({ message: 'Votre compte est bloqué. Contactez un administrateur.' });
        }

        if (req.user.archived) {
            return res.status(403).json({ message: 'Votre compte est archivé. Accès interdit.' });
        }

        // Vérification du rôle
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès refusé. Permissions insuffisantes.' });
        }

        // Si l'utilisateur a le bon rôle, on permet d'accéder à la ressource
        next();
    };
};

export default roleCheck;
