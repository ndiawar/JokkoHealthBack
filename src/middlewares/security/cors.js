import cors from 'cors';

const corsOptions = {
    origin: ['http://example.com', 'http://another-example.com'], // Liste des origines autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes HTTP autorisées
    allowedHeaders: ['Content-Type', 'Authorization'], // En-têtes autorisés
    credentials: true, // Autoriser les cookies
    optionsSuccessStatus: 200 // Pour les navigateurs anciens
};

export default cors(corsOptions);
