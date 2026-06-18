import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API ChatBordage',
      version: '1.0.0',
      description: 'Documentation de l\'API REST pour le jeu de société ChatBordage',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Chemins vers les fichiers contenant les annotations
};

export const specs = swaggerJsdoc(options);
