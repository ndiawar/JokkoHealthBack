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
const port = 3001; // Assurez-vous que le port est correct

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

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Assurez-vous que cela correspond à votre client React
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

let activeUsers = [];

io.on("connection", (socket) => {
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId, senderId, text, chatId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).emit("receive-message", { senderId, text, chatId });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
