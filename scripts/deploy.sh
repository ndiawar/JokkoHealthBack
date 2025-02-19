#!/bin/bash

# Script de déploiement pour JokkoHealthBackEnd

# Variables
APP_DIR="/path/to/JokkoHealthBackEnd"
ENV_FILE="$APP_DIR/.env"

# Vérification de l'environnement
if [ ! -f "$ENV_FILE" ]; then
  echo "Le fichier .env est manquant. Veuillez le créer à partir de .env.example."
  exit 1
fi

# Installation des dépendances
echo "Installation des dépendances..."
cd $APP_DIR
npm install

# Construction de l'application
echo "Construction de l'application..."
npm run build

# Démarrage de l'application
echo "Démarrage de l'application..."
npm start

echo "Déploiement terminé."