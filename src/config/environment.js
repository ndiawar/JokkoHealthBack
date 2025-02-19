const environment = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/jokkohealth',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
    MAIL_SERVICE: process.env.MAIL_SERVICE || 'gmail',
    MAIL_USER: process.env.MAIL_USER || 'your_email@gmail.com',
    MAIL_PASS: process.env.MAIL_PASS || 'your_email_password',
    SWAGGER_URL: process.env.SWAGGER_URL || '/api-docs',
    I18N_LOCALE: process.env.I18N_LOCALE || 'en',
    QUEUE_NAME: process.env.QUEUE_NAME || 'default'
};

export default environment;