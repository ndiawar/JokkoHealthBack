import morgan from 'morgan';
import logger from './logger.js';

const morganMiddleware = morgan('combined', {
    stream: {
        write: (message) => {
            logger.info(message.trim());
        }
    }
});

export default morganMiddleware;