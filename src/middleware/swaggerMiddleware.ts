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
      tags: [
        { name: 'Auth', description: 'Authentication operations' },
        { name: 'Events', description: 'Etkinlik yönetimi' },
        { name: 'Profile', description: 'User profile management' },
        { name: 'Reports', description: 'Rapor yönetimi' },
        { name: 'Users', description: 'User management operations' },
        { name: 'Security', description: 'Security logs' },
        { name: 'Sports', description: 'Spor yönetimi' },
        { name: 'Stats', description: 'İstatistik ve dashboard verileri' },
      ],
      paths: {
        '/api/stats/weekly': {
          get: {
            tags: ['Stats'],
            summary: 'Haftalık istatistikleri getirir',
            description: 'Son 7 gün için günlük etkinlik ve katılımcı sayılarını ve genel özeti döndürür.',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Haftalık istatistikler başarıyla alındı',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/WeeklyStatsResponse'
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/stats/categories': {
          get: {
            tags: ['Stats'],
            summary: 'Kategoriye göre katılımcı dağılımını getirir',
            description: 'Her spor kategorisindeki etkinliklere katılan benzersiz kullanıcı sayısını döndürür.',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Kategori dağılımı başarıyla alındı',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/CategoryDistributionItem'
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/stats/monthly': {
          get: {
            tags: ['Stats'],
            summary: 'Aylık etkinlik istatistiklerini getirir',
            description: 'Her ay için etkinlikleri durumlarına göre sayarak döndürür.',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Aylık istatistikler başarıyla alındı',
                content: {
                  'application/json': {
                    schema: {
                       type: 'array',
                       items: {
                         $ref: '#/components/schemas/MonthlyStatsItem'
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/stats/users/categories': {
          get: {
            tags: ['Stats'],
            summary: 'Kategoriye göre kullanıcı büyümesini getirir',
            description: 'Her spor kategorisi için toplam kullanıcı sayısını ve son 30 gündeki artışı döndürür.',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Kullanıcı kategori büyümesi başarıyla alındı',
                content: {
                  'application/json': {
                    schema: {
                       $ref: '#/components/schemas/UserCategoryGrowthResponse'
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
      },
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
          Report: {
            type: 'object',
            required: ['id', 'konu', 'raporlayan', 'tarih', 'tur', 'oncelik', 'durum'],
            properties: {
              id: {
                type: 'string',
                description: 'Benzersiz rapor kimliği'
              },
              konu: {
                type: 'string',
                description: 'Raporun konusu'
              },
              raporlayan: {
                type: 'string',
                description: 'Raporu gönderen kullanıcının adı'
              },
              tarih: {
                type: 'string',
                description: 'Raporun oluşturulma tarihi (GG.AA.YYYY formatında)'
              },
              tur: {
                type: 'string',
                enum: ['Kullanıcı', 'Etkinlik'],
                description: 'Raporun türü'
              },
              oncelik: {
                type: 'string',
                enum: ['Yüksek', 'Orta', 'Düşük'],
                description: 'Raporun önceliği'
              },
              durum: {
                type: 'string',
                enum: ['Beklemede', 'İnceleniyor', 'Çözüldü', 'Reddedildi'],
                description: 'Raporun mevcut durumu'
              }
            }
          },
          ReportData: {
            type: 'object',
            required: ['id', 'subject', 'description', 'reportedBy', 'reportedDate', 'priority', 'status', 'entityId', 'entityType'],
            properties: {
              id: {
                type: 'number',
                description: 'Benzersiz rapor ID'
              },
              subject: {
                type: 'string',
                description: 'Raporun konusu'
              },
              description: {
                type: 'string',
                description: 'Rapor açıklaması'
              },
              reportedBy: {
                type: 'string',
                description: 'Raporu oluşturan kullanıcı adı'
              },
              reportedDate: {
                type: 'string',
                format: 'date',
                description: 'Raporun oluşturulma tarihi (YYYY-MM-DD formatında)'
              },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Raporun önceliği'
              },
              status: {
                type: 'string',
                enum: ['pending', 'reviewing', 'resolved', 'rejected'],
                description: 'Raporun mevcut durumu'
              },
              entityId: {
                type: 'number',
                description: 'Raporlanan varlığın ID\'si'
              },
              entityType: {
                type: 'string',
                enum: ['user', 'event'],
                description: 'Raporlanan varlığın türü'
              }
            }
          },
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
          UserDetail: {
            type: 'object',
            required: ['id', 'name', 'email', 'role', 'status', 'joinDate'],
            properties: {
              id: {
                type: 'integer',
                description: 'Kullanıcı benzersiz tanımlayıcısı',
              },
              name: {
                type: 'string',
                description: 'Kullanıcının tam adı',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'Kullanıcı e-posta adresi',
              },
              role: {
                type: 'string',
                description: 'Kullanıcı rolü (Türkçe, örn. "üye", "yönetici")',
              },
              status: {
                type: 'string',
                description: 'Kullanıcı hesap durumu (örn. "aktif", "pasif")',
              },
              joinDate: {
                type: 'string',
                format: 'date',
                description: 'Kullanıcının katılma tarihi',
              },
              avatar: {
                type: 'string',
                description: 'Kullanıcı profil resmi yolu',
              },
              registeredDate: {
                type: 'string',
                format: 'date',
                description: 'Kullanıcının kayıt tarihi',
              },
              lastActive: {
                type: 'string',
                format: 'date',
                description: 'Kullanıcının son aktif olduğu tarih',
              },
            },
            example: {
              id: 1,
              name: "Ahmet Koç",
              email: "ahmet@example.com",
              role: "üye",
              status: "aktif",
              joinDate: "2023-01-15",
              avatar: "/avatars/user1.jpg",
              registeredDate: "2023-01-10",
              lastActive: "2023-07-15"
            },
          },
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
          Event: {
            type: 'object',
            required: [
              'id',
              'creator_id',
              'sport_id',
              'title',
              'description',
              'event_date',
              'start_time',
              'end_time',
              'location_name',
              'location_latitude',
              'location_longitude',
              'max_participants',
              'status'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
                description: 'Etkinliğin benzersiz tanımlayıcısı'
              },
              creator_id: {
                type: 'string',
                format: 'uuid',
                description: 'Etkinliği oluşturan kullanıcının ID\'si'
              },
              sport_id: {
                type: 'integer',
                format: 'int64',
                description: 'Etkinliğin spor türünün ID\'si'
              },
              title: {
                type: 'string',
                minLength: 3,
                maxLength: 100,
                description: 'Etkinlik başlığı'
              },
              description: {
                type: 'string',
                maxLength: 1000,
                description: 'Etkinlik açıklaması'
              },
              event_date: {
                type: 'string',
                format: 'date-time',
                description: 'Etkinlik tarihi'
              },
              start_time: {
                type: 'string',
                format: 'date-time',
                description: 'Etkinlik başlangıç zamanı'
              },
              end_time: {
                type: 'string',
                format: 'date-time',
                description: 'Etkinlik bitiş zamanı'
              },
              location_name: {
                type: 'string',
                maxLength: 200,
                description: 'Etkinlik konumunun adı'
              },
              location_latitude: {
                type: 'number',
                format: 'float',
                minimum: -90,
                maximum: 90,
                description: 'Etkinlik konumunun enlem bilgisi'
              },
              location_longitude: {
                type: 'number',
                format: 'float',
                minimum: -180,
                maximum: 180,
                description: 'Etkinlik konumunun boylam bilgisi'
              },
              max_participants: {
                type: 'integer',
                format: 'int32',
                minimum: 2,
                maximum: 1000,
                description: 'Maksimum katılımcı sayısı'
              },
              status: {
                type: 'string',
                enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
                description: 'Etkinliğin durumu'
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Etkinliğin oluşturulma zamanı'
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Etkinliğin son güncellenme zamanı'
              }
            }
          },
          EventParticipant: {
            type: 'object',
            required: [
              'id',
              'event_id',
              'user_id',
              'role',
              'joined_at'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
                description: 'Katılımcı kaydının benzersiz tanımlayıcısı'
              },
              event_id: {
                type: 'integer',
                format: 'int64',
                description: 'Etkinliğin ID\'si'
              },
              user_id: {
                type: 'string',
                format: 'uuid',
                description: 'Katılımcı kullanıcının ID\'si'
              },
              role: {
                type: 'string',
                enum: ['PARTICIPANT', 'ORGANIZER'],
                description: 'Kullanıcının etkinlikteki rolü'
              },
              joined_at: {
                type: 'string',
                format: 'date-time',
                description: 'Kullanıcının etkinliğe katılma tarihi'
              }
            }
          },
          TodayEvent: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
                description: 'Etkinlik ID\'si'
              },
              title: {
                type: 'string',
                description: 'Etkinlik başlığı'
              },
              description: {
                type: 'string',
                description: 'Etkinlik açıklaması'
              },
              date: {
                type: 'string',
                format: 'date',
                description: 'Etkinlik tarihi'
              },
              time: {
                type: 'string',
                description: 'Başlangıç saati (HH:MM)'
              },
              endTime: {
                type: 'string',
                description: 'Bitiş saati (HH:MM)'
              },
              location: {
                type: 'string',
                description: 'Etkinlik konumu'
              },
              category: {
                type: 'string',
                description: 'Etkinlik kategorisi'
              },
              participants: {
                type: 'integer',
                format: 'int32',
                description: 'Katılımcı sayısı'
              },
              maxParticipants: {
                type: 'integer',
                format: 'int32',
                description: 'Maksimum katılımcı sayısı'
              },
              status: {
                type: 'string',
                description: 'Etkinlik durumu'
              },
              organizer: {
                type: 'string',
                description: 'Organizatör adı'
              },
              isAttending: {
                type: 'boolean',
                description: 'Kullanıcı etkinliğe katılıyor mu'
              }
            }
          },
          DailyStat: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date', description: 'Tarih (YYYY-MM-DD)' },
              events: { type: 'integer', description: 'O günkü etkinlik sayısı' },
              participants: { type: 'integer', description: 'O günkü katılımcı sayısı' }
            }
          },
          WeeklyStatsResponse: {
            type: 'object',
            properties: {
              summary: {
                type: 'object',
                properties: {
                  total_events: { type: 'integer', description: 'Haftalık toplam etkinlik' },
                  total_participants: { type: 'integer', description: 'Haftalık toplam katılımcı' }
                }
              },
              daily: {
                type: 'array',
                items: { $ref: '#/components/schemas/DailyStat' },
                description: 'Son 7 günün günlük dökümü'
              }
            }
          },
          CategoryDistributionItem: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Spor kategorisi adı' },
              count: { type: 'integer', description: 'Bu kategorideki benzersiz katılımcı sayısı' }
            }
          },
          MonthlyStatsItem: {
            type: 'object',
            properties: {
               month: { type: 'string', description: 'Ay (YYYY-MM)' },
               onaylanan: { type: 'integer', description: 'Onaylanmış (Aktif) etkinlik sayısı' },
               bekleyen: { type: 'integer', description: 'Bekleyen etkinlik sayısı' },
               iptal_edilen: { type: 'integer', description: 'İptal edilmiş etkinlik sayısı' },
               tamamlanan: { type: 'integer', description: 'Tamamlanmış etkinlik sayısı' }
            }
          },
          UserCategoryGrowthItem: {
             type: 'object',
             properties: {
               name: { type: 'string', description: 'Spor kategorisi adı' },
               users: { type: 'integer', description: 'Bu kategoriyi favorileyen toplam kullanıcı sayısı' },
               change: { type: 'integer', description: 'Son 30 günde favorileyen yeni kullanıcı sayısı' }
             }
          },
          UserCategoryGrowthResponse: {
             type: 'object',
             properties: {
                categories: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserCategoryGrowthItem' }
                },
                period: { type: 'integer', description: 'Değişimin hesaplandığı gün sayısı', example: 30 }
             }
          }
        },
      },
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
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