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
      schemas: {
        NewsItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Haber ID',
              example: 42
            },
            title: {
              type: 'string',
              description: 'Haber başlığı',
              example: 'Spor Dünyasından Son Gelişmeler'
            },
            content: {
              type: 'string',
              description: 'Haber içeriği',
              example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...'
            },
            image_url: {
              type: 'string',
              nullable: true,
              description: 'Haber görseli URL',
              example: 'https://example.com/images/news/42.jpg'
            },
            sport_id: {
              type: 'integer',
              description: 'Spor kategorisi ID',
              example: 4
            },
            Sports: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Futbol'
                },
                icon: {
                  type: 'string',
                  example: 'futbol.png'
                }
              }
            },
            published_date: {
              type: 'string',
              format: 'date-time',
              description: 'Haberin yayınlanma tarihi',
              example: '2025-01-15T12:00:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi',
              example: '2025-01-15T12:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Son güncelleme tarihi',
              example: '2025-01-15T12:00:00Z'
            },
            source_url: {
              type: 'string',
              nullable: true,
              description: 'Haber kaynağı URL',
              example: 'https://example.com/spor/42'
            },
            type: {
              type: 'string',
              description: 'Haber tipi',
              example: 'manual'
            },
            end_time: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Haberin yayından kalkacağı tarih',
              example: '2025-12-31T23:59:59Z'
            }
          }
        }
      }
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // API route ve model dosyalarının bulunduğu dizinler
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs));
}; 