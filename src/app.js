// Importation des dépendances nécessaires
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';  // Importation du fichier index.js dans le répertoire routes
import jwt from 'jsonwebtoken';  // Importer jwt pour gérer l'authentification
import { connectDB } from './config/database.js';  // Importer la fonction de connexion à la DB

// Chargement des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Connexion à la base de données MongoDB
connectDB();  // Appeler la fonction connectDB pour établir la connexion

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Utilisation des routes
app.use('/api', routes);  // Utiliser les routes définies dans `index.js`

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Démarrage de l'application
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;  // Exporter l'application pour pouvoir la tester ou l'utiliser ailleurs
