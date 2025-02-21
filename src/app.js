import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http'; // Importation du module HTTP
import { Server } from 'socket.io';  // Importer la classe Server de socket.io
import bodyParser from 'body-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';  // Importation du fichier index.js dans le répertoire routes
import jwt from 'jsonwebtoken';  // Importer jwt pour gérer l'authentification
import { connectDB } from './config/database.js';  // Importer la fonction de connexion à la DB
import morganMiddleware from './utils/logger/morgan.js';  // Importer ton middleware morgan personnalisé
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Chargement des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();
const port = process.env.PORT || 3001;

// Connexion à la base de données MongoDB
connectDB();  // Appeler la fonction connectDB pour établir la connexion

// Middleware
app.use(cors());
app.use(helmet());
app.use(morganMiddleware);  // Utiliser ton middleware de morgan pour les logs
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jokkohealth API Documentation',
      version: '1.0.0',
      description: 'API documentation for managing appointments',
    },
  },
  apis: ['./routes/**/*.js'], // Modifier pour inclure toutes les routes dans /routes
};

// Swagger Docs setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Utilisation des routes
app.use('/api', routes);  // Utiliser les routes définies dans `index.js`

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Création du serveur HTTP
const server = createServer(app);

// Initialisation de Socket.IO
// Initialisation de Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Permettre l'accès depuis le client React
  },
});

let activeUsers = [];

// Gérer les connexions de Socket.IO
io.on("connection", (socket) => {
  // Ajouter un nouvel utilisateur lorsqu'il se connecte
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // Envoyer la liste des utilisateurs actifs à tous
    io.emit("get-users", activeUsers);
  });

  // Lors de la déconnexion de l'utilisateur
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // Mettre à jour la liste des utilisateurs actifs
    io.emit("get-users", activeUsers);
  });

  // Envoi d'un message à un utilisateur spécifique
  socket.on("send-message", (data) => {
    const { receiverId, senderId, text, chatId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).emit("receive-message", { senderId, text, chatId });
    }
  });
});


// Démarrage de l'application
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;  // Exporter l'application pour pouvoir la tester ou l'utiliser ailleurs