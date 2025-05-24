import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Récupération des origines autorisées depuis les variables d'environnement
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'https://jokkohealth.onrender.com', 'https://jokko-health-front-end.vercel.app'];

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les requêtes mobiles ou curl)
    if (!origin) return callback(null, true);
    
    // Log pour le débogage
    console.log('Origine de la requête:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Origine bloquée par CORS:', origin);
      console.log('Origines autorisées:', allowedOrigins);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

export default cors(corsOptions);
