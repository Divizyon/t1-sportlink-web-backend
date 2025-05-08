import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sportlink API Documentation',
      version: '1.0.0',
      description: 'Sportlink Web Backend API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'JWT token bilginizi girin. "Bearer" öneki otomatik olarak eklenecektir.',
          bearerFormat: 'JWT'
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // API route ve model dosyalarının bulunduğu dizinler
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs));
}; 