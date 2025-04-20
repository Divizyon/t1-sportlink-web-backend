import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Swagger yapılandırması ve API dokümantasyonu için middleware.
 * Bu middleware, API rotaları için OpenAPI/Swagger dokümantasyonu oluşturur ve serve eder.
 */

// Swagger seçenekleri tanımlaması
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SportLink API',
      version: '1.0.0',
      description: 'SportLink uygulaması için API dokümantasyonu',
      contact: {
        name: 'SportLink Takımı',
        email: 'info@sportlink.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'SportLink API Sunucusu',
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
      responses: {
        UnauthorizedError: {
          description: 'Kimlik doğrulama başarısız',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'Oturum açılmamış veya token geçersiz',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Yetkisiz erişim',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'Bu kaynağa erişim yetkiniz yok',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Kaynak bulunamadı',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'İstenen kaynak bulunamadı',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Sunucu hatası',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'Sunucuda beklenmeyen bir hata oluştu',
              },
            },
          },
        },
      },
      schemas: {
        // Temel şema tanımlamaları
        User: {
          type: 'object',
          required: ['id', 'email', 'first_name', 'last_name', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Kullanıcı benzersiz tanımlayıcısı',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Kullanıcı e-posta adresi',
            },
            first_name: {
              type: 'string',
              description: 'Kullanıcı adı',
            },
            last_name: {
              type: 'string',
              description: 'Kullanıcı soyadı',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'coach'],
              description: 'Kullanıcı rolü',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Kullanıcı hesabının oluşturulma tarihi',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Kullanıcı hesabının son güncelleme tarihi',
            },
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'user',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z',
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Hata durumu',
            },
            message: {
              type: 'string',
              description: 'Hata mesajı',
            },
          },
          example: {
            status: 'error',
            message: 'Bir hata oluştu',
          },
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

// Swagger dokümanını oluştur
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger yapılandırmasını uygulama ile entegre eder
 * @param app Express uygulaması
 */
export const setupSwagger = (app: Express): void => {
  // Swagger dokümantasyonu endpoint'i
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Swagger JSON endpoint'i
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger dokümantasyonu şu adreste kullanılabilir: /api-docs');
};