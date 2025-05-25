import ProfileModel from '../../models/user/profileModel.js';
import CrudController from '../base/crudController.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import mjml from 'mjml';
import emailService from '../../services/email/emailService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import BlacklistedToken from '../../models/auth/blacklistedToken.js';
import User from '../../models/user/userModel.js';
import Patient from '../../models/user/patientModel.js';
import MedicalRecord from '../../models/medical/medicalModel.js';
import { upload, handleMulterError } from '../../config/multerConfig.js';  // Importer la configuration Multer
import NotificationService from '../../services/notificationService.js';

// Utilisation de fileURLToPath pour obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UserController extends CrudController {
    constructor() {
        super(User);
        this.updateUserState = this.updateUserState.bind(this);
        this.blockUser = this.blockUser.bind(this);
        this.unblockUser = this.unblockUser.bind(this);
        this.archiveUser = this.archiveUser.bind(this);
        this.unarchiveUser = this.unarchiveUser.bind(this);
        this.uploadPhoto = this.uploadPhoto.bind(this);
    }

    // 📌 Inscription d'un utilisateur
    async register(req, res) {
        const { nom, prenom, email, role, dateNaissance, sexe, telephone, adresse } = req.body;

        // Fonction pour générer un username unique
        const generateUsername = async (nom, prenom) => {
            if (!prenom || !nom) {
                throw new Error("Prénom ou nom manquant pour générer un username");
            }

            let username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}`;
            let suffix = 1;
            let existingUser = await User.findOne({ username });

            while (existingUser) {
                username = `${prenom.charAt(0).toLowerCase()}${nom.toLowerCase()}${suffix}`;
                existingUser = await User.findOne({ username });
                suffix++;
            }

            return username;
        };

        if (!nom || !prenom || !email || !role || !telephone) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être renseignés" });
        }

        if (!['Patient', 'Medecin', 'SuperAdmin'].includes(role)) {
            return res.status(400).json({ message: "Rôle invalide" });
        }

        try {
            // Vérifier que le créateur est un médecin si le rôle est "Patient"
            if (role === 'Patient') {
                const userId = req.user.id;  // Utiliser l'ID de l'utilisateur authentifié
                const authenticatedUser = await User.findById(userId);

                if (!authenticatedUser || authenticatedUser.role !== 'Medecin') {
                    return res.status(403).json({ message: "Seul un médecin peut créer un patient" });
                }
            }

            // Vérification de l'unicité de l'email et du téléphone
            const userWithSameEmail = await User.findOne({ email });
            if (userWithSameEmail) {
                return res.status(400).json({ message: "L'email est déjà utilisé" });
            }

            const userWithSameTelephone = await User.findOne({ telephone });
            if (userWithSameTelephone) {
                return res.status(400).json({ message: "Le numéro de téléphone est déjà utilisé" });
            }

            // Générer le username unique
            const username = await generateUsername(nom, prenom);

            // Hacher le mot de passe par défaut
            const hashedPassword = await bcrypt.hash('jokkohealth25', 10);

            // Créer un nouvel utilisateur
            const newUser = new User({
                nom, prenom, email, motDePasse: hashedPassword, role, dateNaissance, sexe, telephone, adresse, username
            });

            await newUser.save();

            // Si le rôle est "Patient", créer le dossier médical et lier le médecin
            if (role === 'Patient') {
                // Vérifier si un dossier médical existe déjà pour ce patient
                const existingMedicalRecord = await MedicalRecord.findOne({ patientId: newUser._id });
                if (existingMedicalRecord) {
                    return res.status(400).json({ message: "Ce patient a déjà un dossier médical existant" });
                }

                // Créer un nouveau dossier médical
                const medicalRecord = new MedicalRecord({
                    patientId: newUser._id,
                    medecinId: req.user.id,
                    statut: 'Stable'
                });
                await medicalRecord.save();

                // Lier le dossier médical au patient
                newUser.medicalRecord = medicalRecord._id;
                await newUser.save();

                // Créer une notification pour le patient
                try {
                  await NotificationService.createNotification({
                      userId: newUser._id,
                      title: 'Nouveau Dossier Médical Créé',
                      message: `Votre dossier médical a été créé par le Dr. ${req.user.nom} ${req.user.prenom}`,
                      type: 'medical',
                      priority: 'medium',
                      data: {
                          medicalRecordId: medicalRecord._id,
                          doctorName: `${req.user.nom} ${req.user.prenom}`
                      }
                  });
                } catch (err) {
                  console.error('Erreur lors de la création de la notification patient:', err);
                }

                // Récupérer tous les SuperAdmin pour leur envoyer une notification
                const superAdmins = await User.find({ role: 'SuperAdmin' });
                // Créer une notification pour chaque SuperAdmin
                for (const superAdmin of superAdmins) {
                  try {
                    await NotificationService.createNotification({
                        userId: superAdmin._id,
                        title: 'Nouveau Patient Inscrit',
                        message: `Le Dr. ${req.user.nom} ${req.user.prenom} a créé un nouveau dossier médical pour ${newUser.nom} ${newUser.prenom}`,
                        type: 'system',
                        priority: 'low',
                        data: {
                            patientId: newUser._id,
                            patientName: `${newUser.nom} ${newUser.prenom}`,
                            doctorId: req.user.id,
                            doctorName: `${req.user.nom} ${req.user.prenom}`,
                            medicalRecordId: medicalRecord._id
                        }
                    });
                  } catch (err) {
                    console.error('Erreur lors de la notification SuperAdmin:', err);
                  }
                }
            }

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
                .replace('{{loginLink}}', 'http://localhost:3000/login'); // Remplacer par l'URL de votre page de connexion

            // Envoi de l'email de bienvenue avec les informations de connexion
            const subject = 'Bienvenue sur JokkoHealth!';

            // Envoi de l'email via votre service Email
            await emailService.sendEmail({
                to: email,
                subject,
                text: '',
                html: htmlContent
            });

            // // Envoi de l'email de bienvenue
            // const subject = 'Bienvenue sur JokkoHealth!';
            // const htmlContent = "<html><body><p>Bienvenue sur JokkoHealth!</p></body></html>";  // Exemple simplifié
            // await emailService.sendEmail({ to: email, subject, html: htmlContent });

            return res.status(201).json({
                message: "Utilisateur créé avec succès. Un email de bienvenue a été envoyé.",
                user: {
                    id: newUser._id,
                    nom: newUser.nom,
                    prenom: newUser.prenom,
                    email: newUser.email,
                    role: newUser.role,
                    username: newUser.username
                }
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            return res.status(500).json({ message: "Erreur serveur" });
        }
    }

    // 📌 Connexion d'un utilisateur
    async login(req, res) {
        try {
            // Vérification des erreurs de validation des entrées
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, motDePasse } = req.body;
            console.log('Tentative de connexion pour:', email);

            if (!email || !motDePasse) {
                return res.status(400).json({ message: 'Email et mot de passe sont requis' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                console.log('Utilisateur non trouvé:', email);
                return res.status(401).json({ message: 'Identifiants invalides, veuillez vérifier votre email' });
            }

            console.log('Utilisateur trouvé:', {
                id: user._id,
                email: user.email,
                role: user.role,
                motDePasseHashé: user.motDePasse.startsWith('$2')
            });

            if (user.blocked || user.archived) {
                return res.status(403).json({ message: 'Accès refusé : utilisateur bloqué ou archivé' });
            }

            // Vérifier si le mot de passe est haché
            if (!user.motDePasse.startsWith('$2')) {
                console.log('Mot de passe non haché, hachage en cours...');
                // Si le mot de passe n'est pas haché, le hacher
                user.motDePasse = await bcrypt.hash(user.motDePasse, 10);
                await user.save();
                console.log('Mot de passe haché et sauvegardé');
            }

            const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
            console.log('Résultat de la comparaison des mots de passe:', isMatch);

            if (!isMatch) {
                return res.status(401).json({ message: 'Identifiants invalides, veuillez vérifier votre mot de passe' });
            }

            // Génération du token JWT
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Configuration des cookies
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 86400000 // 24 heures en millisecondes
            });

            return res.status(200).json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Erreur détaillée lors de la connexion:', error);
            return res.status(500).json({ error: 'Erreur serveur, veuillez réessayer plus tard' });
        }
    }

    // 📌 Mise à jour du profil utilisateur
    async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.params.id;

            // Vérifier si l'utilisateur existe
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier si l'utilisateur a le droit de modifier ce profil
            if (req.user.role !== 'SuperAdmin' && req.user._id.toString() !== userId) {
                return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que votre propre profil.' });
            }

            // Mise à jour de l'utilisateur
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                req.body,
                { new: true, runValidators: true }
            );

            return res.status(200).json({ message: 'Profil mis à jour avec succès', user: updatedUser });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
        }
    }

    // 📌 Méthode générique pour gérer les actions sur un ou plusieurs utilisateurs
    async updateUserState(req, res, ids, action) {
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Aucun identifiant fourni." });
        }

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
            // Mise à jour des utilisateurs concernés
            const result = await User.updateMany({ _id: { $in: ids } }, { $set: update });
            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "Aucun utilisateur trouvé pour cette action." });
            }

            // Récupération des utilisateurs mis à jour
            const users = await User.find({ _id: { $in: ids } });

            // Chargement du template email
            const mjmlFilePath = path.join(__dirname, '../../../src/templates/emails/etatUser/etat.mjml');
            const mjmlContent = fs.readFileSync(mjmlFilePath, 'utf8');
            const { html } = mjml(mjmlContent);

            // Envoi d'un email à chaque utilisateur concerné
            for (const user of users) {
                const htmlContent = html.replace('{{prenom}}', user.prenom).replace('{{action}}', actionLabel);
                await emailService.sendEmail({
                    to: user.email,
                    subject: `Votre compte a été ${actionLabel}`,
                    text: `Bonjour ${user.prenom}, votre compte a été ${actionLabel}.`,
                    html: htmlContent,
                });
            }

            return res.status(200).json({
                message: `Action '${action}' effectuée sur ${result.modifiedCount} utilisateur(s).`,
                users
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'état des utilisateurs:", error);
            return res.status(500).json({ message: "Erreur serveur", error });
        }
    }

    // 📌 Méthodes spécifiques pour bloquer/débloquer/archiver/désarchiver un utilisateur
    async blockUser(req, res) {
        return this.updateUserState(req, res, [req.params.id], 'block');
    }

    async unblockUser(req, res) {
        return this.updateUserState(req, res, [req.params.id], 'unblock');
    }

    async archiveUser(req, res) {
        return this.updateUserState(req, res, [req.params.id], 'archive');
    }

    async unarchiveUser(req, res) {
        return this.updateUserState(req, res, [req.params.id], 'unarchive');
    }
    
    // 📌 Déconnexion d'un utilisateur
    async logout(req, res) {
        try {
            // Récupérer le token JWT à partir de l'en-tête Authorization
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(400).json({ message: "Token manquant dans l'en-tête Authorization" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(400).json({ message: "Token invalide" });
            }

            // Ajouter le token à la liste noire
            const blacklistedToken = new BlacklistedToken({
                token,
                expiresAt: new Date(decoded.exp * 1000)
            });

            await blacklistedToken.save();
            res.clearCookie('jwt'); // Supprimer le cookie JWT
            return res.status(200).json({ message: "Déconnexion réussie" });
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            return res.status(500).json({ message: "Erreur serveur lors de la déconnexion", error: error.message });
        }
    }

    // 📌 Récupération des informations d'un utilisateur connecté
    async getMe(req, res) {
        try {
            const user = await User.findById(req.user.id).select('-motDePasse');
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

     // Méthode pour obtenir les stats des patients
     async getPatientStats(req, res) {
        try {
            const { newPatientsCount, oldPatientsCount } = await User.getPatientCounts();
    
            // Exemple de nombres de patients du mois précédent (peut être calculé ou récupéré d'une base de données)
            const previousNewPatientsCount = 100;  // Nombre de nouveaux patients du mois précédent (exemple)
            const previousOldPatientsCount = 80;   // Nombre d'anciens patients du mois précédent (exemple)
    
            console.log('New Patients Count:', newPatientsCount);
            console.log('Old Patients Count:', oldPatientsCount);
    
            // Calcul des pourcentages de changement pour les nouveaux et anciens patients
            let newPatientsPercentage = 0;
            let oldPatientsPercentage = 0;
    
            // Gestion du cas où le mois précédent a 0 nouveaux patients
            if (previousNewPatientsCount === 0) {
                if (newPatientsCount > 0) {
                    newPatientsPercentage = 100;  // Si c'est le premier mois avec des patients, le pourcentage est 100%
                }
            } else {
                // Calcul du pourcentage de variation des nouveaux patients
                newPatientsPercentage = ((newPatientsCount - previousNewPatientsCount) / previousNewPatientsCount) * 100;
            }
    
            // Calcul du pourcentage pour les anciens patients
            if (previousOldPatientsCount === 0) {
                if (oldPatientsCount > 0) {
                    oldPatientsPercentage = 100;  // Si c'est le premier mois avec des anciens patients, le pourcentage est 100%
                }
            } else {
                oldPatientsPercentage = ((oldPatientsCount - previousOldPatientsCount) / previousOldPatientsCount) * 100;
            }
    
            console.log('New Patients Percentage:', newPatientsPercentage);
            console.log('Old Patients Percentage:', oldPatientsPercentage);
    
            // Renvoyer les résultats au client
            return res.status(200).json({
                success: true,
                newPatientsCount,
                oldPatientsCount,
                newPatientsPercentage: newPatientsPercentage.toFixed(2),  // Limité à 2 décimales
                oldPatientsPercentage: oldPatientsPercentage.toFixed(2),
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques des patients:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des statistiques des patients." });
        }
    }
    
    // 📌 Upload de photo de profil
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
            }

            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Mettre à jour le chemin de la photo dans le profil de l'utilisateur
            user.photo = `/uploads/profiles/${req.file.filename}`;
            await user.save();

            return res.status(200).json({
                message: 'Photo de profil mise à jour avec succès',
                photo: user.photo
            });
        } catch (error) {
            console.error('Erreur lors de l\'upload de la photo:', error);
            return res.status(500).json({ message: 'Erreur lors de l\'upload de la photo' });
        }
    }
}

// Exporte la classe directement
export default new UserController();