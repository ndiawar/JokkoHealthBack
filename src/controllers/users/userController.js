import User from '../../models/user/userModel.js';
import ProfileModel from '../../models/user/profileModel.js';
import CrudController from '../base/crudController.js'
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import mjml from 'mjml';
import emailService from '../../services/email/emailService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Utilisation de fileURLToPath pour obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UserController extends CrudController {
    constructor() {
        super(User);
    }

    // 📌 Inscription d'un utilisateur    
    async register(req, res) {
        const { nom, prenom, email, role, dateNaissance, sexe, telephone } = req.body;

        // Fonction pour générer un username unique
        const generateUsername = async (nom, prenom) => {
            let username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}`; // "johndoe" pour "John Doe"
            let suffix = 1;
            let existingUser = await User.findOne({ username });

            // Si le username existe déjà, on ajoute un suffixe
            while (existingUser) {
                username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}${suffix}`;
                existingUser = await User.findOne({ username });
                suffix++;
            }

            return username;
        };

        // Vérification des champs obligatoires
        if (!nom || !prenom || !email || !role || !telephone) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être renseignés" });
        }

        // Vérification du rôle
        if (!['Patient', 'Medecin', 'SuperAdmin'].includes(role)) {
            return res.status(400).json({ message: "Rôle invalide" });
        }

        try {
            // Vérifier l'unicité de l'email
            const userWithSameEmail = await User.findOne({ email });
            if (userWithSameEmail) {
                return res.status(400).json({ message: "L'email est déjà utilisé" });
            }

            // Vérifier l'unicité du numéro de téléphone
            const userWithSameTelephone = await User.findOne({ telephone });
            if (userWithSameTelephone) {
                return res.status(400).json({ message: "Le numéro de téléphone est déjà utilisé" });
            }

            // Générer le username
            const username = await generateUsername(nom, prenom);

            // Hacher le mot de passe par défaut
            const hashedPassword = await bcrypt.hash('jokkohealth25', 10);

            // Créer un nouvel utilisateur avec le mot de passe haché
            const newUser = new User({
                nom,
                prenom,
                email,
                motDePasse: hashedPassword, // Mot de passe haché
                role,
                dateNaissance,
                sexe,
                telephone,
                username  // Ajouter le username généré
            });

            // Sauvegarder l'utilisateur
            await newUser.save();

            // Charger le fichier MJML depuis le répertoire local
            const mjmlFilePath = path.join(__dirname, '../../../src/templates/emails/welcomes/welcome.mjml');
            const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8'); // Lire le fichier MJML

            // Compiler le contenu MJML en HTML
            const { html } = mjml(mjmlContent);

            // Remplacer les variables dynamiques dans le contenu HTML
            const htmlContent = html
                .replace('{{prenom}}', prenom)
                .replace('{{nom}}', nom)
                .replace('{{username}}', username)
                .replace('{{email}}', email)
                .replace('{{loginLink}}', 'https://jokkohealth.com/login'); // Remplacer par l'URL de votre page de connexion

            // Envoi de l'email de bienvenue avec les informations de connexion
            const subject = 'Bienvenue sur JokkoHealth!';

            // Envoi de l'email via votre service Email
            await emailService.sendEmail({
                to: email,
                subject,
                text: '',
                html: htmlContent
            });

            return res.status(201).json({
                message: "Utilisateur créé avec succès. Un email de bienvenue a été envoyé.",
                user: {
                    id: newUser._id,
                    nom: newUser.nom,
                    prenom: newUser.prenom,
                    email: newUser.email,
                    role: newUser.role,
                    telephone: newUser.telephone,
                    username: newUser.username // Inclure le username dans la réponse
                }
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }

    // Fin de la fonction register
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

    // 📌 Méthode pour bloquer un utilisateur
    async blockUser(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier si l'utilisateur est déjà bloqué
            if (user.etat === 'bloqué') {
                return res.status(400).json({ message: 'L\'utilisateur est déjà bloqué' });
            }

            // Mettre à jour l'état de l'utilisateur à "bloqué"
            user.etat = 'bloqué';
            await user.save();

            return res.status(200).json({ message: 'Utilisateur bloqué avec succès', user });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    // 📌 Méthode pour débloquer un utilisateur
    async unblockUser(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier si l'utilisateur est déjà débloqué
            if (user.etat !== 'bloqué') {
                return res.status(400).json({ message: 'L\'utilisateur n\'est pas bloqué' });
            }

            // Mettre à jour l'état de l'utilisateur à "actif"
            user.etat = 'actif';
            await user.save();

            return res.status(200).json({ message: 'Utilisateur débloqué avec succès', user });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    // 📌 Méthode pour archiver un utilisateur (remplace la suppression)
    async archiveUser(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier si l'utilisateur est déjà archivé
            if (user.etat === 'archivé') {
                return res.status(400).json({ message: 'L\'utilisateur est déjà archivé' });
            }

            // Mettre à jour l'état de l'utilisateur à "archivé"
            user.etat = 'archivé';
            await user.save();

            return res.status(200).json({ message: 'Utilisateur archivé avec succès', user });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

}

// Exporte la classe directement
export default new UserController();
