import express from 'express';
import path from 'path';  // Importation de path
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Remplacer __dirname par import.meta.url pour obtenir le répertoire actuel
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();

// Configuration pour servir les fichiers statiques depuis 'public'
app.use('/public', express.static(path.join(__dirname, '../../public')));

// Configuration Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JokkoHealth API',
            version: '1.0.0',
            description: `Documentation de l'API pour JokkoHealth.  
                JokkoHealthBackEnd répond à un besoin urgent au Sénégal, où l'accès aux soins médicaux est limité, 
                en particulier dans les zones rurales. Le manque de médecins spécialistes, 
                combiné à une distance importante entre les patients et les hôpitaux, 
                entraîne des délais critiques dans les situations d'urgence.`,
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: "Serveur de développement",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/v1/*.js'], // Inclure les fichiers contenant les routes
};

// Générer la documentation Swagger
const swaggerSpec = swaggerJsDoc(options);

// Personnaliser l'interface Swagger
const setupSwagger = (app) => {
    const customOptions = {
        customCss: `
            .swagger-ui .topbar { 
                background-color: #2c3e50; 
                height: 100px; 
                padding: 0 20px;
            }
            .swagger-ui .topbar img {
                height: 80px;
                width: auto;
                margin-top: 10px;
            }
        `,
        customJs: '/public/assets/js/customLogo.js',  // Fichier JavaScript personnalisé pour ajouter le logo
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
};

export default setupSwagger;
