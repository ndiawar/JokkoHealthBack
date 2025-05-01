import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../../models/user/userModel.js';
import BlacklistedToken from '../../models/auth/blacklistedToken.js';

// Promisify pour transformer jwt.verify en fonction asynchrone
const verifyToken = promisify(jwt.verify);

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
    console.log("Début du middleware d'authentification");
    
    // Essayer de récupérer le token depuis le cookie
    let token = req.cookies.jwt;
    console.log("Token depuis les cookies:", token ? "présent" : "absent");

    // Si pas de token dans les cookies, essayer de le récupérer depuis l'en-tête Authorization
    if (!token) {
        const authHeader = req.headers.authorization;
        console.log("En-tête Authorization:", authHeader);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log("Token extrait de l'en-tête:", token);
        }
    }

    if (!token) {
        console.log("Aucun token trouvé");
        return res.status(401).json({ message: 'Aucun token fourni' });
    }

    try {
        // Vérifier si le token est blacklisté
        const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
            console.log("Token blacklisté trouvé");
            return res.status(401).json({ message: "Token invalide. Veuillez vous reconnecter." });
        }

        // Vérification du token JWT
        console.log("Vérification du token JWT");
        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        console.log("Token décodé:", decoded);

        console.log("Recherche de l'utilisateur avec l'ID:", decoded.id);
        const user = await User.findById(decoded.id).populate('medicalRecord');
        if (!user) {
            console.log("Utilisateur non trouvé");
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        console.log("Utilisateur trouvé:", user._id);
        req.user = user;  // Attache l'utilisateur avec le dossier médical à la requête
        next();
    } catch (error) {
        console.error("Erreur détaillée dans l'authentification:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return res.status(401).json({ 
            message: 'Non autorisé', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
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
