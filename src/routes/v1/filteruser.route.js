import express from 'express';
import { 
    getTotalUsersByRole, 
    filterPatients, 
    filterPatientsAndMedecinsForMonthlyGraph 
} from '../../controllers/users/filterUser.js';
import { authenticate } from '../../middlewares/auth/authenticate.js'; // Middleware d'authentification
import roleCheck from '../../middlewares/auth/roleCheck.js'; // Middleware de vérification des rôles

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des utilisateurs (Patients, Médecins, SuperAdmins)
 */

/**
 * @swagger
 * /users/total-by-role:
 *   get:
 *     summary: Obtenir le total des utilisateurs par rôle
 *     description: Récupère le nombre total de patients, médecins et SuperAdmins.
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Totaux des utilisateurs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Totaux des utilisateurs récupérés avec succès."
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: number
 *                       example: 150
 *                     totalMedecins:
 *                       type: number
 *                       example: 20
 *                     totalSuperAdmins:
 *                       type: number
 *                       example: 2
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Une erreur est survenue lors de la récupération des totaux des utilisateurs."
 *                 error:
 *                   type: string
 *                   example: "Erreur de connexion à la base de données"
 */
router.get('/total-by-role', authenticate, roleCheck(['SuperAdmin']), getTotalUsersByRole);

/**
 * @swagger
 * /users/filter-patients:
 *   get:
 *     summary: Filtrer les patients
 *     description: Récupère la liste de tous les patients en excluant les champs sensibles.
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Liste des patients récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Patients récupérés avec succès."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nom:
 *                         type: string
 *                         example: "Dupont"
 *                       prenom:
 *                         type: string
 *                         example: "Jean"
 *                       email:
 *                         type: string
 *                         example: "jean.dupont@gmail.com"
 *       404:
 *         description: Aucun patient trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Aucun patient trouvé."
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Une erreur est survenue lors du filtrage des patients."
 *                 error:
 *                   type: string
 *                   example: "Erreur de connexion à la base de données"
 */
router.get('/filter-patients', authenticate, roleCheck(['SuperAdmin', 'Medecin']), filterPatients);

/**
 * @swagger
 * /users/filter-patients
 *   get:
 *     summary: Filtrer les patients et les médecins pour chaque fin de mois
 *     description: Récupère les données mensuelles des patients par sexe (Homme et Femme).
 *     tags: [Utilisateurs]
 *     responses:
 *       200:
 *         description: Données mensuelles des patients (hommes et femmes) récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Données mensuelles des patients (hommes et femmes) récupérées avec succès."
 *                 data:
 *                   type: object
 *                   properties:
 *                     hommes:
 *                       type: number
 *                       example: 20
 *                     femmes:
 *                       type: number
 *                       example: 30
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Une erreur est survenue lors de la récupération des données mensuelles."
 *                 error:
 *                   type: string
 *                   example: "Erreur de connexion à la base de données"
 */ 
router.get('/filter-patients-medecins-monthly', filterPatientsAndMedecinsForMonthlyGraph);

export default router;