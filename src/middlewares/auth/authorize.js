const authorize = (roles = []) => {
    // Si les rôles ne sont pas spécifiés, tous les utilisateurs sont autorisés
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Vérifiez si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Vérifiez si l'utilisateur a le rôle requis
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Autoriser l'accès
        next();
    };
};

export default authorize;
