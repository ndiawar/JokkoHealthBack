import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../../models/user/userModel.js';

// Promisify pour transformer jwt.verify en fonction asynchrone
const verifyToken = promisify(jwt.verify);

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
    // Récupérer le token depuis l'en-tête Authorization
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    // Vérifier si le token est présent
    if (!token) {
        return res.status(401).json({ message: 'Aucun token fourni' });
    }

    try {
        // Décoder le token JWT pour obtenir l'ID de l'utilisateur
        const decoded = await verifyToken(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur correspondant dans la base de données
        const user = await User.findById(decoded.id);

        // Si l'utilisateur n'est pas trouvé
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        // Attacher l'utilisateur authentifié à la requête (pour l'utiliser dans les routes suivantes)
        req.user = user;

        // Passer au prochain middleware ou à la route
        next();
    } catch (error) {
        // Si une erreur se produit lors de la vérification du token, retour d'une erreur Unauthorized
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
