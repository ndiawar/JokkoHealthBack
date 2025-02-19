#!/bin/bash

# Script de sauvegarde pour JokkoHealthBackEnd

# Définir les variables
BACKUP_DIR="./backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="nom_de_la_base_de_données"
DB_USER="utilisateur"
DB_PASSWORD="mot_de_passe"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
echo "Sauvegarde de la base de données..."
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Sauvegarde de Redis
echo "Sauvegarde de Redis..."
redis-cli -h $REDIS_HOST -p $REDIS_PORT --rdb $BACKUP_DIR/redis_backup_$TIMESTAMP.rdb

# Compresser les sauvegardes
echo "Compression des sauvegardes..."
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR .

# Nettoyer les fichiers de sauvegarde non compressés
rm $BACKUP_DIR/db_backup_$TIMESTAMP.sql
rm $BACKUP_DIR/redis_backup_$TIMESTAMP.rdb

echo "Sauvegarde terminée avec succès!"