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
import BlacklistedToken from '../../models/auth/blacklistedToken.js'; // Import du modèle


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

            // Vérifier si l'utilisateur est bloqué ou archivé
            if (user.blocked) {
                return res.status(403).json({ message: 'Accès refusé : utilisateur bloqué' });
            }
            if (user.archived) {
                return res.status(403).json({ message: 'Accès refusé : utilisateur archivé' });
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

    // 📌 Méthode générique pour gérer les actions sur un ou plusieurs utilisateurs
       async updateUserState(req, res) {
        // On attend un tableau d'IDs et une action : 'block', 'unblock', 'archive', 'unarchive'
        const { ids, action } = req.body; // ex: { ids: ['id1', 'id2'], action: 'block' }

        if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Aucun identifiant fourni." });
        }

        // Définir l'état cible et le libellé d'action (pour l'email) en fonction de l'action
        let update, actionLabel;
        switch (action) {
        case 'block':
            update = { blocked: true };
            actionLabel = 'bloqué';
            break;
        case 'unblock':
            update = { blocked: false };
            actionLabel = 'débloqué';
            break;
        case 'archive':
            update = { archived: true };
            actionLabel = 'archivé';
            break;
        case 'unarchive':
            update = { archived: false };
            actionLabel = 'désarchivé';
            break;
        default:
            return res.status(400).json({ message: "Action invalide." });
        }

        try {
        // Mettre à jour tous les utilisateurs dont l'état doit être modifié
        const result = await User.updateMany(
            { _id: { $in: ids } },
            { $set: update }
        );

        // Récupérer les utilisateurs mis à jour
        const users = await User.find({ _id: { $in: ids } });

        // Charger le template MJML
        const mjmlFilePath = path.join(
            __dirname,
            '../../../src/templates/emails/etatUser/etat.mjml'
        );
        const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8');
        const { html } = mjml(mjmlContent);

        // Envoyer un email à chaque utilisateur mis à jour
        for (const user of users) {
            // Remplacer les variables dans le template HTML
            const htmlContent = html
            .replace('{{prenom}}', user.prenom)
            .replace('{{action}}', actionLabel);
            
            // Envoi de l'email via le service email
            await emailService.sendEmail({
            to: user.email,
            subject: `Votre compte a été ${actionLabel}`,
            text: `Bonjour ${user.prenom}, votre compte a été ${actionLabel}.`,
            html: htmlContent,
            });
        }

        return res.status(200).json({
            message: `Action '${action}' effectuée sur ${result.nModified} utilisateur(s).`,
            users
        });
        } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
        }
    }

    // Méthode pour bloquer un utilisateur (action sur un seul utilisateur)
    async blockUser(req, res) {
        req.body = {
        ids: [req.params.id],
        action: 'block'
        };
        return this.updateUserState(req, res);
    }

    // Méthode pour débloquer un utilisateur (action sur un seul utilisateur)
    async unblockUser(req, res) {
        req.body = {
        ids: [req.params.id],
        action: 'unblock'
        };
        return this.updateUserState(req, res);
    }

    // Méthode pour archiver un utilisateur (action sur un seul utilisateur)
    async archiveUser(req, res) {
        req.body = {
        ids: [req.params.id],
        action: 'archive'
        };
        return this.updateUserState(req, res);
    }

    // Méthode pour désarchiver un utilisateur (action sur un seul utilisateur)
    async unarchiveUser(req, res) {
        req.body = {
        ids: [req.params.id],
        action: 'unarchive'
        };
        return this.updateUserState(req, res);
    }
    // 📌 Déconnexion d'un utilisateur
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token depuis le header
            
            if (!token) {
                return res.status(400).json({ message: "Token manquant" });
            }
    
            // Vérifier et décoder le token pour obtenir ses informations
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Utilisation de verify au lieu de decode
            if (!decoded) {
                return res.status(400).json({ message: "Token invalide" });
            }
    
            // Ajouter le token à la liste noire avec sa date d'expiration
            const blacklistedToken = new BlacklistedToken({
                token,
                expiresAt: new Date(decoded.exp * 1000) // Convertir les secondes en millisecondes
            });
    
            await blacklistedToken.save();
    
            return res.status(200).json({ message: "Déconnexion réussie" });
        } catch (error) {
            return res.status(500).json({ message: "Erreur lors de la déconnexion", error: error.message });
        }
    }
    

}

// Exporte la classe directement
export default new UserController();
