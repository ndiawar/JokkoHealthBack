import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("La variable d'environnement MONGODB_URI est manquante");
    }

    await mongoose.connect(uri); // Plus besoin d'options obsolètes

    console.log('✅ Connexion à MongoDB Atlas réussie');
  } catch (error) {
    console.error('❌ Échec de la connexion à MongoDB Atlas :', error.message);
    process.exit(1);
  }
};

export { connectDB };
