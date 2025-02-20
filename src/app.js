import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { connectDB } from './config/database.js';
import morganMiddleware from './utils/logger/morgan.js';
import setupSwagger from './config/swagger.js';

// Chargement des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Connexion à la base de données MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morganMiddleware);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup Swagger
setupSwagger(app);

// Utilisation des routes
app.use('/api', routes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Démarrage de l'application
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
