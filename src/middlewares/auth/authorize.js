import User from '../../models/user/userModel.js';

// Middleware d'autorisation basé sur le rôle de l'utilisateur
const authorize = (roles = []) => {
    // Si les rôles ne sont pas spécifiés, tous les utilisateurs sont autorisés
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return async (req, res, next) => {
        // Vérifie si l'utilisateur est authentifié (c'est-à-dire que req.user est déjà défini)
        if (!req.user) {
            return res.status(401).json({ message: 'Non autorisé - Utilisateur non authentifié' });
        }

        try {
            // Vérifie si l'utilisateur a l'un des rôles nécessaires
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Interdit - Rôle non autorisé' });
            }

            // Si l'utilisateur a le rôle requis, on passe à la suite
            return next();
        } catch (error) {
            return res.status(500).json({ message: 'Erreur serveur', error: error.message });
        }
    };
};

export default authorize;
