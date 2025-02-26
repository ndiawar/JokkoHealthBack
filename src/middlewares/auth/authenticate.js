import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../../models/user/userModel.js';
import BlacklistedToken from '../../models/auth/blacklistedToken.js';


// Promisify pour transformer jwt.verify en fonction asynchrone
const verifyToken = promisify(jwt.verify);

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
    const token = req.cookies.jwt; // Récupérer le token depuis le cookie

    if (!token) {
        return res.status(401).json({ message: 'Aucun token fourni' });
    }

    try {
        // Vérification du token JWT
        const decoded = await verifyToken(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Non autorisé', error: error.message });
    }
};

// Middleware pour récupérer les informations de l'utilisateur authentifié
export const getAuthenticatedUser = (req, res) => {
    // Si l'utilisateur est authentifié, retourner ses informations
    if (req.user) {
        return res.status(200).json({
            message: "Utilisateur authentifié",
            user: {
                id: req.user._id,
                nom: req.user.nom,
                prenom: req.user.prenom,
                email: req.user.email,
                role: req.user.role,
                telephone: req.user.telephone,
                dateNaissance: req.user.dateNaissance,
                sexe: req.user.sexe
            }
        });
    }

    // Si l'utilisateur n'est pas authentifié
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
};


export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    // Vérifier si le token est blacklisté
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
        return res.status(401).json({ message: "Token invalide. Veuillez vous reconnecter." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expiré." });
    }
};

export default authMiddleware;
