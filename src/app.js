// Importation des dépendances nécessaires
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
app.use(morganMiddleware);  // Utiliser ton middleware de morgan pour les logs
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`🔹 Requête reçue: ${req.method} ${req.url}`);
  next();
});

// Utilisation des routes
app.use('/api', routes);  // Utiliser les routes définies dans `index.js`
console.log("🔹 Routes disponibles :", app._router.stack
  .filter(r => r.route)
  .map(r => r.route.path)
);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


// Création du serveur HTTP
const server = createServer(app);

// Initialisation de Socket.IO
const io = new Server(server);

// --- Gestion des WebSockets avec Socket.IO ---
let connectedUsers = [];

io.on('connection', (socket) => {
  console.log('Nouvelle connexion WebSocket:', socket.id);

  // Gestion du pseudo
  socket.on('pseudo', async (pseudo) => {
    try {
      let user = await User.findOne({ pseudo });
      if (!user) {
        user = new User({ pseudo });
        await user.save();
        socket.broadcast.emit('newUserInDb', pseudo);
      }

      _joinRoom(socket, 'salon1');
      socket.pseudo = pseudo;
      connectedUsers.push(socket);
      socket.broadcast.to(socket.channel).emit('newUser', pseudo);
    } catch (error) {
      console.error('Erreur lors de la gestion du pseudo:', error);
    }
  });

  // Chargement des anciens messages privés
  socket.on('oldWhispers', async (pseudo) => {
    try {
      const messages = await Chat.find({ receiver: pseudo }).limit(3);
      socket.emit('oldWhispers', messages);
    } catch (error) {
      console.error('Erreur lors de la récupération des anciens messages:', error);
    }
  });

  // Changement de salon
  socket.on('changeChannel', (channel) => {
    _joinRoom(socket, channel);
  });

  // Envoi d'un message
  socket.on('newMessage', async (message, receiver) => {
    try {
      if (receiver === 'all') {
        const chat = new Chat({ _id_room: socket.channel, sender: socket.pseudo, receiver, content: message });
        await chat.save();
        socket.broadcast.to(socket.channel).emit('newMessageAll', { message, pseudo: socket.pseudo });
      } else {
        const user = await User.findOne({ pseudo: receiver });
        if (user) {
          const socketReceiver = connectedUsers.find(u => u.pseudo === user.pseudo);
          if (socketReceiver) {
            socketReceiver.emit('whisper', { sender: socket.pseudo, message });
          }
          const chat = new Chat({ sender: socket.pseudo, receiver, content: message });
          await chat.save();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  });

  // Déconnexion d'un utilisateur
  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(u => u !== socket);
    socket.broadcast.to(socket.channel).emit('quitUser', socket.pseudo);
  });

  // Événements de saisie
  socket.on('writting', (pseudo) => {
    socket.broadcast.to(socket.channel).emit('writting', pseudo);
  });

  socket.on('notWritting', (pseudo) => {
    socket.broadcast.to(socket.channel).emit('notWritting', pseudo);
  });

  // Fonction pour rejoindre un salon
  async function _joinRoom(socket, channel) {
    let previousChannel = socket.channel || '';
    socket.leaveAll();
    socket.join(channel);
    socket.channel = channel;

    try {
      let room = await Room.findOne({ name: channel });
      if (!room) {
        room = new Room({ name: channel });
        await room.save();
        socket.broadcast.emit('newChannel', channel);
      }

      const messages = await Chat.find({ _id_room: channel });
      socket.emit('oldMessages', messages, socket.pseudo);

      if (previousChannel) {
        socket.emit('emitChannel', { previousChannel, newChannel: channel });
      } else {
        socket.emit('emitChannel', { newChannel: channel });
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du salon:', error);
    }
  }
});

// Démarrage de l'application
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;  // Exporter l'application pour pouvoir la tester ou l'utiliser ailleurs