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
        },
        UserReport: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Rapor ID',
              example: 42
            },
            report_reason: {
              type: 'string',
              description: 'Rapor sebebi',
              example: 'Uygunsuz davranış'
            },
            report_date: {
              type: 'string',
              format: 'date-time',
              description: 'Rapor tarihi',
              example: '2025-01-15T14:30:00Z'
            },
            status: {
              type: 'string',
              description: 'Raporun durumu',
              example: 'pending',
              enum: ['pending', 'reviewing', 'resolved', 'rejected']
            },
            event_id: {
              type: 'string',
              description: 'Raporlanan etkinlik ID (eğer etkinlik raporuysa)',
              example: '123e4567-e89b-12d3-a456-426614174000',
              nullable: true
            },
            reported_id: {
              type: 'string',
              description: 'Raporlanan kullanıcı ID (eğer kullanıcı raporuysa)',
              example: '123e4567-e89b-12d3-a456-426614174001',
              nullable: true
            },
            reported: {
              type: 'object',
              description: 'Raporlanan kullanıcı bilgileri',
              nullable: true,
              properties: {
                username: {
                  type: 'string',
                  example: 'johndoe'
                },
                first_name: {
                  type: 'string',
                  example: 'John'
                },
                last_name: {
                  type: 'string',
                  example: 'Doe'
                }
              }
            },
            event: {
              type: 'object',
              description: 'Raporlanan etkinlik bilgileri',
              nullable: true,
              properties: {
                title: {
                  type: 'string',
                  example: 'Pazar Sabahı Koşusu'
                }
              }
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