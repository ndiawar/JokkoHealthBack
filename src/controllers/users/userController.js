import User from '../../models/user/userModel.js';
import ProfileModel from '../../models/user/profileModel.js';
import CrudController from '../base/crudController.js'
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserController extends CrudController {
    constructor() {
        super(User);
    }

    // 📌 Inscription d'un utilisateur
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, motDePasse } = req.body;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }

            // Hashage du mot de passe
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(motDePasse, salt);

            // Création de l'utilisateur
            const newUser = await User.create({ ...req.body, motDePasse: hashedPassword });

            return res.status(201).json(newUser);
        } catch (error) {
            return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
        }
    }

    // 📌 Connexion d'un utilisateur
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, motDePasse } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            // Vérifier le mot de passe
            const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
            if (!isMatch) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            // Générer un token JWT
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.status(200).json({ token, user });
        } catch (error) {
            return res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
    }

    // 📌 Mise à jour du profil utilisateur
    async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            return res.status(200).json(updatedUser);
        } catch (error) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
        }
    }
}

// Exporte la classe directement
export default new UserController();
