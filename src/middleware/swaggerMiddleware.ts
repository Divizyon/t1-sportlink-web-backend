import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger yapılandırması ve API dokümantasyonu için middleware.
 * Bu middleware, API rotaları için OpenAPI/Swagger dokümantasyonu oluşturur ve serve eder.
 * 
 * @param app Express uygulaması
 */
export const setupSwagger = (app: express.Application): void => {
  // Swagger seçenekleri tanımlaması
  const swaggerOptions = {
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
          url: process.env.API_URL || 'http://localhost:3000',
          description: 'SportLink API Sunucusu',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'API token\'ınızı doğrudan girebilirsiniz. "Bearer" öneki otomatik olarak eklenecektir.',
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
          // Kullanıcı modeli
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
          // Kullanıcı oluşturma şeması
          CreateUserDTO: {
            type: 'object',
            required: ['email', 'password', 'first_name', 'last_name'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'Kullanıcı e-posta adresi',
              },
              password: {
                type: 'string',
                format: 'password',
                minLength: 8,
                description: 'Kullanıcı şifresi (min. 8 karakter)',
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
                default: 'user',
                description: 'Kullanıcı rolü (varsayılan: user)',
              },
            },
            example: {
              email: 'user@example.com',
              password: 'password123',
              first_name: 'John',
              last_name: 'Doe',
            },
          },
          // Giriş DTO şeması
          LoginDTO: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'Kullanıcı e-posta adresi',
              },
              password: {
                type: 'string',
                format: 'password',
                description: 'Kullanıcı şifresi',
              },
            },
            example: {
              email: 'user@example.com',
              password: 'password123',
            },
          },
          // Şifre sıfırlama şeması
          ResetPasswordDTO: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'Şifresini sıfırlamak istediğiniz hesabın e-posta adresi',
              },
            },
            example: {
              email: 'user@example.com',
            },
          },
          // Kimlik doğrulama yanıt şeması
          AuthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success'],
                description: 'İşlem durumu',
              },
              data: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User',
                  },
                  session: {
                    type: 'object',
                    properties: {
                      access_token: {
                        type: 'string',
                        description: 'JWT erişim tokeni',
                      },
                      refresh_token: {
                        type: 'string',
                        description: 'JWT yenileme tokeni',
                      },
                    },
                  },
                },
              },
            },
          },
          // Başarılı yanıt şeması
          SuccessResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success'],
                description: 'İşlem durumu',
              },
              message: {
                type: 'string',
                description: 'Başarı mesajı',
              },
            },
            example: {
              status: 'success',
              message: 'İşlem başarıyla tamamlandı',
            },
          },
          // Hata yanıt şeması
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
    },
    apis: ['./src/routes/*.ts'],
  };

  // Swagger doküman oluşturma
  const swaggerSpec = swaggerJsdoc(swaggerOptions) as { paths?: Record<string, any> };
  
  // API yollarını düzeltme - Route'ların başına /api eklemek
  if (swaggerSpec && swaggerSpec.paths) {
    const updatedPaths: Record<string, any> = {};
    
    // Tüm yolları döngüyle gezerek düzelt
    Object.keys(swaggerSpec.paths).forEach(path => {
      // Eğer path /api ile başlamıyorsa ekle
      if (!path.startsWith('/api')) {
        // Örneğin: "/auth/login" -> "/api/auth/login"
        const newPath = `/api${path}`;
        updatedPaths[newPath] = swaggerSpec.paths![path];
      } else {
        // Zaten /api ile başlıyorsa olduğu gibi bırak
        updatedPaths[path] = swaggerSpec.paths![path];
      }
    });
    
    // Orijinal paths'i güncelle
    swaggerSpec.paths = updatedPaths;
  }

  // Swagger UI özelleştirmeleri
  const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SportLink API Dokümantasyonu',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'none', // 'list', 'full', 'none'
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
      persistAuthorization: true,
    },
  };

  // Swagger endpointlerini ayarlama
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // API isteklerine middleware - Bearer token ekleme
  app.use('/api', (req: Request, res: Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      req.headers.authorization = `Bearer ${authHeader}`;
    }
    next();
  });

  // Swagger JSON formatında API tanımını sunma
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}; 