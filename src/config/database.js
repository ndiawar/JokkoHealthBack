import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();  // Importation de dotenv pour charger les variables d'environnement

const dbConfig = {
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    database: process.env.MONGODB_DB_NAME || 'jokkohealth',
    username: process.env.MONGODB_USER || 'yafatoukane',
    password: process.env.MONGODB_PASSWORD || '',  // Assure-toi que c'est bien encodé
   
};

const connectDB = async () => {
    try {
        const uri = process.env.NODE_ENV === 'test' 
            ? process.env.MONGODB_URI_TEST
            : `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

        // Connexion à MongoDB
        await mongoose.connect(uri);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);  // Quitter l'application si la connexion échoue
    }
};

export { connectDB, dbConfig };