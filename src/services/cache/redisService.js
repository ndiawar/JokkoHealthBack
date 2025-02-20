import redis from 'redis';
import { promisify } from 'util';
import config from '../../config/redis.js'; // Assurez-vous que ce fichier contient vos configurations Redis

// Création du client Redis
const redisClient = redis.createClient({
    host: config.host,
    port: config.port,
    password: config.password,
});

// Variable pour vérifier si une connexion est en cours
let isConnecting = false;
let retryTimeout = 5000; // Délai de départ pour reconnexion
const maxRetryTimeout = 60000; // Délai maximum (1 minute)

// Écoute des événements Redis
redisClient.on('connect', () => {
    console.log('Client Redis connecté');
});

redisClient.on('ready', () => {
    console.log('Client Redis prêt');
});

redisClient.on('error', (err) => {
    console.error('Erreur Redis:', err);
    if (err.code === 'ECONNREFUSED' && !isConnecting) {
        isConnecting = true;
        console.log('Tentative de reconnexion à Redis...');
        setTimeout(() => {
            redisClient.connect().finally(() => {
                isConnecting = false;
            });
        }, retryTimeout);
        retryTimeout = Math.min(retryTimeout * 2, maxRetryTimeout); // Délai exponentiel
    }
});

// Promisification des commandes Redis
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

// Service Redis
const redisService = {
    // Récupérer une valeur depuis Redis
    get: async (key) => {
        if (!redisClient.connected) {
            console.error('La connexion Redis est fermée');
            await redisClient.connect(); // Tentative de reconnexion si fermé
        }
        try {
            console.time(`redis-get-time-${key}`); // Log de performance
            const value = await getAsync(key);
            console.timeEnd(`redis-get-time-${key}`); // Log de performance

            if (!value) {
                console.log(`Clé ${key} non trouvée dans Redis`);
            }
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la clé ${key} :`, error);
            throw new Error('Erreur lors de la récupération de la valeur depuis Redis');
        }
    },

    // Ajouter ou mettre à jour une valeur dans Redis
    set: async (key, value, expirationInSeconds) => {
        if (!redisClient.connected) {
            console.error('La connexion Redis est fermée');
            await redisClient.connect(); // Tentative de reconnexion si fermé
        }
        try {
            console.time(`redis-set-time-${key}`); // Log de performance
            const stringValue = JSON.stringify(value);
            await setAsync(key, stringValue, 'EX', expirationInSeconds); // Expiration en secondes
            console.timeEnd(`redis-set-time-${key}`); // Log de performance
            console.log(`Définition de la clé : ${key} avec expiration : ${expirationInSeconds}s`);
        } catch (error) {
            console.error(`Erreur lors de la définition de la clé ${key} :`, error);
            throw new Error('Erreur lors de la définition de la valeur dans Redis');
        }
    },

    // Supprimer une clé dans Redis
    del: async (key) => {
        if (!redisClient.connected) {
            console.error('La connexion Redis est fermée');
            await redisClient.connect(); // Tentative de reconnexion si fermé
        }
        try {
            console.time(`redis-del-time-${key}`); // Log de performance
            await delAsync(key);
            console.timeEnd(`redis-del-time-${key}`); // Log de performance
            console.log(`Suppression de la clé : ${key}`);
        } catch (error) {
            console.error(`Erreur lors de la suppression de la clé ${key} :`, error);
            throw new Error('Erreur lors de la suppression de la valeur dans Redis');
        }
    },

    // Ne pas fermer Redis de manière prématurée
    close: () => {
        redisClient.quit(() => {
            console.log('Client Redis fermé proprement');
        });
    }
};

// Export du service Redis
export default redisService;
