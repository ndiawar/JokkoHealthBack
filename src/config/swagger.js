import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger options
const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Appointments API',
        version: '1.0.0',
        description: 'API documentation for managing appointments',
      },
    },
    apis: ['./routes/**/*.js'], // Modifier pour inclure toutes les routes dans /routes
  };
  

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;