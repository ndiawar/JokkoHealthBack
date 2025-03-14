import mongoose from 'mongoose';
import User from './models/user/userModel.js';  // Assure-toi d'ajuster le chemin d'importation selon ta structure de projet
import { faker } from '@faker-js/faker';  // Importation de la bibliothèque faker
import dotenv from 'dotenv';
import { connectDB } from './config/database.js'; 

// Connexion à la base de données MongoDB
dotenv.config();
connectDB();

const seedUsers = async () => {
  const users = [];

  // Créer 20 utilisateurs de type 'Patient' avec des données aléatoires
  for (let i = 0; i < 20; i++) {
    const sexe = Math.random() > 0.5 ? 'Homme' : 'Femme'; // Sexe aléatoire

    // Générer un numéro de téléphone valide
    const phonePrefixes = ['70', '75', '76', '77', '78'];
    const prefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
    const phoneNumber = `${prefix}${faker.number.int({ min: 1000000, max: 9999999 })}`;  // Remplacer par faker.number.int()

    // Générer une date de naissance aléatoire dans les mois de janvier à mai 2025
    const month = Math.floor(Math.random() * 5) + 1; // Mois de 1 (janvier) à 5 (mai)
    const year = 2025;
    const day = Math.floor(Math.random() * 28) + 1; // Pour éviter de dépasser les jours du mois
    const dateNaissance = new Date(year, month - 1, day); // Mois commence à 0

    const user = {
      nom: faker.person.lastName(), // Utilisation de faker.person au lieu de faker.name
      prenom: faker.person.firstName(), // Utilisation de faker.person
      email: faker.internet.email(),
      motDePasse: '$2a$10$OUsXYWd6f66RW//zPGj8uOdrB/hfmfZ0YY55synmPNNCwFxzpDAOq', // Exemple de mot de passe bcrypté
      role: 'Patient', // Spécifier uniquement 'Patient'
      dateNaissance: dateNaissance, // Date de naissance dans le mois de janvier à mai 2025
      sexe: sexe,
      telephone: phoneNumber, // Numéro de téléphone valide
      username: faker.internet.username(), // Remplacer `userName` par `username` pour éviter les avertissements
      imageUrl: faker.image.avatar(), // Image aléatoire
      blocked: false,
      archived: false,
      resetPasswordAttempts: 0,
      lastResetPasswordAttempt: new Date(),
    };

    users.push(user);
  }

  try {
    const createdUsers = await User.insertMany(users);
    console.log('Users créés avec succès:', createdUsers);
  } catch (error) {
    console.error('Erreur lors de l\'insertion des utilisateurs :', error);
  }

  mongoose.connection.close();
};

// Lancer le seeder
seedUsers();
