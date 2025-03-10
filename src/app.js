import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import morganMiddleware from './utils/logger/morgan.js';
import setupSwagger from './config/swagger.js';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/database.js';
import corsConfig from './middlewares/security/cors.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

dotenv.config();

const app = express();
const port = 3001;

connectDB();

app.use(corsConfig);
app.use(helmet());
app.use(morganMiddleware);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, '../public')));

setupSwagger(app);
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
app.post('/api/sensors/register', (req, res) => {
  const sensorData = req.body;
  console.log("Données reçues du capteur :", sensorData);
  // Traitez les données ici, par exemple, enregistrez-les dans une base de données
  res.status(200).send("Données reçues avec succès");
});
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Accepter toutes les origines pour le test
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

let socketClients = {};

io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté.");

    socket.on("new-user-add", (newUserId) => {
        socketClients[newUserId] = socket;
        console.log(`Utilisateur ${newUserId} ajouté aux clients.`);
    });

    socket.on("disconnect", () => {
        Object.keys(socketClients).forEach((userId) => {
            if (socketClients[userId] === socket) {
                delete socketClients[userId];
                console.log(`Utilisateur ${userId} déconnecté.`);
            }
        });
    });

    socket.on("message", (data) => {
        console.log("Message reçu :", data);
        // Traitez le message ici
    });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
