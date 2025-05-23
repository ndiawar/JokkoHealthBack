import cors from 'cors';

// Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://jokkohealth.onrender.com',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
