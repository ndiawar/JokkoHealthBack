// src/services/auth/tokenService.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET_KEY;

// Fonction pour générer un token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, SECRET_KEY, {
        expiresIn: '1h',  // Exemple de durée d'expiration du token
    });
};

// Fonction pour vérifier un token
const verifyToken = (token) => {
    return jwt.verify(token, SECRET_KEY);
};

export { generateToken, verifyToken };
