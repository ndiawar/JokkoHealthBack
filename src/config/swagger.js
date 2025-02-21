import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JokkoHealth API',
            version: '1.0.0',
            description: 'Documentation de l\'API pour JokkoHealth',
        },
        servers: [
            {
                url: 'http://localhost:3000/api'
            },
        ],
    },
    apis: ['./src/routes/v1/*.js'], // Chemin vers les fichiers de routes
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;