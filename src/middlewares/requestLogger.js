import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });

// Setup the logger
const requestLogger = morgan('combined', { stream: accessLogStream });

export default requestLogger;
