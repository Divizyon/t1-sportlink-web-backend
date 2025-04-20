import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SportLink API Dokümantasyonu',
      version: '1.0.0',
      description: 'SportLink API için REST endpoint dokümantasyonu',
      contact: {
        name: 'SportLink Destek',
        email: 'destek@sportlink.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Geliştirme sunucusu',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Swagger yapılandırmasını uygulama ile entegre eder
 * @param app Express uygulaması
 */
const setupSwagger = (app: Express): void => {
  // Swagger dokümantasyonu endpoint'i
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Swagger JSON endpoint'i
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger dokümantasyonu şu adreste kullanılabilir: /api-docs');
};

export default setupSwagger; 