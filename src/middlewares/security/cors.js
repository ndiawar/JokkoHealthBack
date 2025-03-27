import cors from 'cors';

// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:3000'], // Autoriser l'accès uniquement depuis http://localhost:3000 (Frontend)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'], // En-têtes autorisés
  credentials: true, // Permettre l'envoi des cookies
  optionsSuccessStatus: 200, // Pour les anciens navigateurs qui attendent un status 200 pour les requêtes OPTIONS
};

export default cors(corsOptions);
