import express from 'express';
import path from 'path';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// 📌 Définition du chemin du dossier public
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const publicPath = path.join(__dirname, '../public');

// 📌 Servir les fichiers statiques
const swaggerStaticPath = '/public/assets/images/logo.png';

// 📌 Configuration Swagger
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
                url: 'http://localhost:3000/api',
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
    apis: ['./src/routes/v1/*.js'], 
};

// 📌 Générer la documentation Swagger
const swaggerSpec = swaggerJsDoc(options);

// 📌 Personnaliser Swagger UI
const customOptions = {
    customCss: `
        .swagger-ui .topbar { 
            background-color: rgb(56, 132, 207) !important;
            height: 80px;
            display: flex;
            align-items: center;
            padding-left: 20px;
        }
        .swagger-ui img {
            content: url('${swaggerStaticPath}') !important;
            height: 60px !important;
            width: auto;
        }
    `,
    customSiteTitle: "JokkoHealth API Docs", // Modifier le titre de Swagger UI
};

// 📌 Initialiser Swagger
const setupSwagger = (app) => {
    app.use('/public', express.static(publicPath)); // Rendre le logo accessible
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
};

export default setupSwagger;
