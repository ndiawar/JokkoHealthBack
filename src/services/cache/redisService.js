import redis from 'redis';
import { promisify } from 'util';
import config from '../../config/redis.js';

const redisClient = redis.createClient({
    host: config.host,
    port: config.port,
    password: config.password,
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

const redisService = {
    get: async (key) => {
        try {
            const value = await getAsync(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            throw new Error('Error getting value from Redis:', error);
        }
    },

    set: async (key, value, expirationInSeconds) => {
        try {
            const stringValue = JSON.stringify(value);
            await setAsync(key, stringValue, 'EX', expirationInSeconds);
        } catch (error) {
            throw new Error('Error setting value in Redis:', error);
        }
    },

    del: async (key) => {
        try {
            await delAsync(key);
        } catch (error) {
            throw new Error('Error deleting value from Redis:', error);
        }
    },
};

export default redisService;