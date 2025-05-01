import express, { Request, Response, Express } from 'express';
import swaggerJsdoc, { Options, OAS3Definition } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger yapılandırması ve API dokümantasyonu için middleware.
 * Bu middleware, API rotaları için OpenAPI/Swagger dokümantasyonu oluşturur ve serve eder.
 * 
 * @param app Express uygulaması
 */
export const setupSwagger = (app: Express): void => {
  // Swagger seçenekleri tanımlaması
  const swaggerOptions: Options = {
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
        { name: 'News Scraper', description: 'Haber scraping işlemleri' },
        { name: 'Notifications', description: 'Bildirim yönetimi' },
        { name: 'Announcements', description: 'Duyuru yönetimi' },
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
        '/api/news-scraper/scraped': {
          get: {
            tags: ['News Scraper'],
            summary: 'Tüm scrape edilmiş haberleri listeler',
            description: 'Tüm scrape edilmiş haberleri durumlarına bakılmaksızın listeler',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Tüm haberler başarıyla listelendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        count: {
                          type: 'number',
                          example: 10
                        },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/NewsItem'
                          }
                        }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/news-scraper/test': {
          get: {
            tags: ['News Scraper'],
            summary: 'API durum kontrolü (Test)',
            description: "API'nin çalışıp çalışmadığını kontrol etmek için test endpointi (kimlik doğrulaması gerektirmez)",
            responses: {
              '200': {
                description: 'API çalışıyor',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        message: {
                          type: 'string',
                          example: 'Haber Scraper API çalışıyor!'
                        },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-04-27T12:34:56.789Z'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/news-scraper/scrape': {
          post: {
            tags: ['News Scraper'],
            summary: "URL'den haber scrape et",
            description: "Belirtilen URL'den haber içeriğini scrape eder ve veritabanına kaydeder (admin yetkileri gerektirir)",
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['url', 'sport_id'],
                    properties: {
                      url: {
                        type: 'string',
                        description: "Haber scrape edilecek web sitesi URL'si",
                        example: 'https://www.haberturk.com/spor'
                      },
                      sport_id: {
                        type: 'number',
                        description: "Spor kategorisi ID'si",
                        example: 1
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Haberler başarıyla kaydedildi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        message: {
                          type: 'string',
                          example: '5 haber başarıyla kaydedildi'
                        },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/NewsItem'
                          }
                        }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Geçersiz istek',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    },
                    example: {
                      status: 'error',
                      message: "Haber URL'si gereklidir"
                    }
                  }
                }
              },
              '404': {
                description: 'Haber bulunamadı',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    },
                    example: {
                      status: 'error',
                      message: "URL'den haber bulunamadı"
                    }
                  }
                }
              },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/news-scraper/pending': {
          get: {
            tags: ['News Scraper'],
            summary: 'Bekleyen haberleri listele',
            description: 'Onay bekleyen haberleri listeler (admin yetkileri gerektirir)',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Bekleyen haberler başarıyla listelendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        count: {
                          type: 'number',
                          example: 3
                        },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/NewsItem'
                          }
                        }
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
        '/api/news-scraper/{id}/status': {
          patch: {
             tags: ['News Scraper'],
             summary: 'Haber durumunu güncelle',
             description: "Belirtilen ID'ye sahip haberin durumunu güncellers (onayla/reddet)",
             security: [{ bearerAuth: [] }],
             parameters: [
               {
                 in: 'path',
                 name: 'id',
                 required: true,
                 schema: {
                   type: 'integer'
                 },
                 description: "Durumu güncellenecek haberin ID'si"
               }
             ],
             requestBody: {
               required: true,
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                     required: ['status'],
                     properties: {
                       status: {
                         type: 'string',
                         enum: ['APPROVED', 'REJECTED'],
                         description: 'Yeni haber durumu'
                       }
                     }
                   }
                 }
               }
             },
             responses: {
               '200': {
                 description: 'Haber durumu başarıyla güncellendi',
                 content: {
                   'application/json': {
                     schema: {
                       type: 'object',
                       properties: {
                         status: { type: 'string', example: 'success' },
                         message: { type: 'string', example: 'Haber durumu güncellendi' },
                         data: { $ref: '#/components/schemas/NewsItem' }
                       }
                     }
                   }
                 }
               },
               '400': { description: 'Geçersiz ID veya durum', $ref: '#/components/responses/BadRequestError' },
               '401': { $ref: '#/components/responses/UnauthorizedError' },
               '403': { $ref: '#/components/responses/ForbiddenError' },
               '404': { description: 'Haber bulunamadı', $ref: '#/components/responses/NotFoundError' },
               '500': { $ref: '#/components/responses/InternalServerError' }
             }
           }
         },
        '/api/news-scraper/approved': {
          get: {
            tags: ['News Scraper'],
            summary: 'Onaylanmış haberleri listele',
            description: 'Onaylanmış haberleri listeler',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Onaylanmış haberler başarıyla listelendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        count: {
                          type: 'number',
                          example: 5
                        },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/NewsItem'
                          }
                        }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/news-scraper/rejected': {
          get: {
            tags: ['News Scraper'],
            summary: 'Reddedilmiş haberleri listele',
            description: 'Reddedilmiş haberleri listeler',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Reddedilmiş haberler başarıyla listelendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['success'],
                          example: 'success'
                        },
                        count: {
                          type: 'number',
                          example: 3
                        },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/NewsItem'
                          }
                        }
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
        '/api/news-scraper/{id}': {
          delete: {
            tags: ['News Scraper'],
            summary: 'Haberi sil',
            description: "Belirtilen ID'ye sahip haberi tamamen siler",
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                schema: {
                  type: 'integer'
                },
                description: "Silinecek haberin ID'si"
              }
            ],
            responses: {
              '200': {
                description: 'Haber başarıyla silindi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { 
                          type: 'string', 
                          enum: ['success'],
                          example: 'success' 
                        },
                        message: { 
                          type: 'string', 
                          example: 'Haber başarıyla silindi' 
                        },
                        data: { 
                          $ref: '#/components/schemas/NewsItem' 
                        }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Geçersiz istek',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    },
                    example: {
                      status: 'error',
                      message: "Geçerli bir haber ID'si gereklidir"
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '404': {
                description: 'Haber bulunamadı',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    },
                    example: {
                      status: 'error',
                      message: 'Haber bulunamadı veya silinemedi'
                    }
                  }
                }
              },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications': {
          get: {
            tags: ['Notifications'],
            summary: 'Kullanıcı bildirimlerini listele',
            description: 'Oturum açmış kullanıcının bildirimlerini filtreli bir şekilde listeler',
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                in: 'query',
                name: 'read_status',
                schema: {
                  type: 'string',
                  enum: ['all', 'read', 'unread']
                },
                description: 'Bildirim okunma durumu filtresi',
                default: 'all'
              },
              {
                in: 'query',
                name: 'limit',
                schema: {
                  type: 'integer',
                  default: 10
                },
                description: 'Sayfa başına gösterilecek bildirim sayısı'
              },
              {
                in: 'query',
                name: 'offset',
                schema: {
                  type: 'integer',
                  default: 0
                },
                description: 'Sayfalama için atlanacak bildirim sayısı'
              }
            ],
            responses: {
              '200': {
                description: 'Bildirimler başarıyla getirildi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        count: { type: 'integer', example: 5 },
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Notification'
                          }
                        }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications/unread-count': {
          get: {
            tags: ['Notifications'],
            summary: 'Okunmamış bildirim sayısını al',
            description: 'Oturum açmış kullanıcının okunmamış bildirim sayısını döndürür',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Okunmamış bildirim sayısı başarıyla getirildi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        count: { type: 'integer', example: 3 }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications/{id}/read': {
          put: {
            tags: ['Notifications'],
            summary: 'Bildirimi okundu olarak işaretle',
            description: 'Belirli bir bildirimi okundu olarak işaretler',
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                schema: {
                  type: 'integer'
                },
                description: 'Okundu olarak işaretlenecek bildirim ID'
              }
            ],
            responses: {
              '200': {
                description: 'Bildirim başarıyla okundu olarak işaretlendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Bildirim okundu olarak işaretlendi' },
                        data: { $ref: '#/components/schemas/Notification' }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '404': { $ref: '#/components/responses/NotFoundError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications/mark-all-read': {
          put: {
            tags: ['Notifications'],
            summary: 'Tüm bildirimleri okundu olarak işaretle',
            description: 'Oturum açmış kullanıcının tüm bildirimlerini okundu olarak işaretler',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Tüm bildirimler başarıyla okundu olarak işaretlendi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Tüm bildirimler okundu olarak işaretlendi' },
                        count: { type: 'integer', example: 5 }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications/{id}': {
          delete: {
            tags: ['Notifications'],
            summary: 'Bildirimi sil',
            description: 'Belirli bir bildirimi siler',
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                in: 'path',
                name: 'id',
                required: true,
                schema: {
                  type: 'integer'
                },
                description: 'Silinecek bildirim ID'
              }
            ],
            responses: {
              '200': {
                description: 'Bildirim başarıyla silindi',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Bildirim başarıyla silindi' }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '404': { $ref: '#/components/responses/NotFoundError' },
              '500': { $ref: '#/components/responses/InternalServerError' }
            }
          }
        },
        '/api/notifications/test': {
          post: {
            tags: ['Notifications'],
            summary: 'Test bildirimi oluştur',
            description: 'Test amaçlı bir bildirim oluşturur (isteğe bağlı olarak user_id belirtilebilir, belirtilmezse oturum açan kullanıcı için oluşturulur)',
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['notification_type', 'content'],
                    properties: {
                      user_id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'İsteğe bağlı bildirim gönderilecek kullanıcı ID (belirtilmezse oturum açan kullanıcı için oluşturulur)'
                      },
                      notification_type: {
                        type: 'string',
                        enum: ['EVENT_INVITATION', 'EVENT_UPDATE', 'FRIEND_REQUEST', 'SYSTEM_NOTIFICATION', 'NEW_MESSAGE'],
                        description: 'Bildirim tipi'
                      },
                      content: {
                        type: 'string',
                        description: 'Bildirim içeriği'
                      },
                      link: {
                        type: 'string',
                        description: 'Bildirime tıklandığında yönlendirilecek bağlantı'
                      },
                      event_id: {
                        type: 'integer',
                        description: 'İlgili etkinlik ID (varsa)'
                      }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Test bildirimi başarıyla oluşturuldu',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Test bildirimi oluşturuldu' },
                        data: { $ref: '#/components/schemas/Notification' }
                      }
                    }
                  }
                }
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
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
            description: "API token'ınızı doğrudan girebilirsiniz. \"Bearer\" öneki otomatik olarak eklenecektir.",
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
          BadRequestError: {
            description: 'Geçersiz istek',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { status: 'error', message: 'Geçersiz istek parametreleri' }
              }
            }
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
          NewsItem: {
            type: 'object',
            properties: {
              id: { type: 'integer', description: "Haberin benzersiz ID'si" },
              title: { type: 'string', description: 'Haber başlığı' },
              link: { type: 'string', format: 'url', description: 'Haberin orijinal linki' },
              image_url: { type: 'string', format: 'url', description: "Haber görseli URL'si" },
              source: { type: 'string', description: 'Haber kaynağı (örn. Haberturk)' },
              sport_id: { type: 'integer', description: "İlişkili spor kategorisi ID'si" },
              status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Haberin durumu' },
              created_at: { type: 'string', format: 'date-time', description: 'Oluşturulma tarihi' },
              updated_at: { type: 'string', format: 'date-time', description: 'Güncellenme tarihi' }
            }
          },
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
                description: "Raporlanan varlığın ID'si"
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
                enum: ['ADMIN', 'STAFF', 'USER'],
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
              role: 'USER',
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
                enum: ['ADMIN', 'STAFF', 'USER'],
                default: 'USER',
                description: 'Kullanıcı rolü (varsayılan: USER)',
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
                type: 'string',
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
                enum: ['üye', 'admin', 'personel'],
                description: 'Kullanıcı rolü (Türkçe)',
              },
              status: {
                type: 'string',
                enum: ['aktif', 'pasif', 'beklemede'],
                description: 'Kullanıcı hesap durumu',
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
              id: '550e8400-e29b-41d4-a716-446655440000',
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
            required: ['password'],
            properties: {
              password: {
                type: 'string',
                format: 'password',
                minLength: 8,
                description: 'Yeni şifre (min. 8 karakter)'
              }
            },
            example: {
              password: 'newSecurePassword123'
            }
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
                description: "Etkinliği oluşturan kullanıcının ID'si"
              },
              sport_id: {
                type: 'integer',
                format: 'int64',
                description: "Etkinliğin spor türünün ID'si"
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
                description: "Etkinliğin ID'si"
              },
              user_id: {
                type: 'string',
                format: 'uuid',
                description: "Katılımcı kullanıcının ID'si"
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
                description: "Etkinlik ID'si"
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
          },
          NotificationType: {
            type: 'string',
            enum: [
              'new_report',
              'new_event',
              'event_updated',
              'user_watched',
              'user_inactive',
              'user_active',
              'new_achievement',
              'pending_approval',
              'news_approved',
              'system_alert'
            ],
            description: 'Bildirim türlerini tanımlar'
          },
          Notification: {
            type: 'object',
            required: ['notification_type', 'content', 'read_status', 'user_id'],
            properties: {
              id: {
                type: 'integer',
                description: 'Bildirimin benzersiz tanımlayıcısı'
              },
              notification_type: {
                $ref: '#/components/schemas/NotificationType',
                description: 'Bildirimin türü'
              },
              content: {
                type: 'string',
                description: 'Bildirim içeriği'
              },
              read_status: {
                type: 'boolean',
                description: 'Bildirimin okunma durumu'
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Bildirimin oluşturulma tarihi'
              },
              event_id: {
                type: 'integer',
                description: 'İlişkili etkinlik ID (varsa)'
              },
              user_id: {
                type: 'string',
                description: 'Bildirimin hedef kullanıcı ID\'si'
              },
              link: {
                type: 'string',
                description: 'Bildirimin yönlendireceği link (opsiyonel)'
              }
            }
          },
          CreateNotificationParams: {
            type: 'object',
            required: ['notification_type', 'content', 'user_id'],
            properties: {
              notification_type: {
                $ref: '#/components/schemas/NotificationType',
                description: 'Bildirimin türü'
              },
              content: {
                type: 'string',
                description: 'Bildirim içeriği'
              },
              event_id: {
                type: 'integer',
                description: 'İlişkili etkinlik ID (varsa)'
              },
              user_id: {
                type: 'string',
                description: 'Bildirimin hedef kullanıcı ID\'si'
              },
              link: {
                type: 'string',
                description: 'Bildirimin yönlendireceği link (opsiyonel)'
              }
            }
          },
          ListNotificationsParams: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'Bildirimleri filtrelemek için kullanıcı ID\'si'
              },
              read_status: {
                type: 'boolean',
                description: 'Bildirim okunma durumuna göre filtreleme'
              },
              limit: {
                type: 'integer',
                description: 'Sayfalandırma için limit değeri'
              },
              offset: {
                type: 'integer',
                description: 'Sayfalandırma için başlangıç değeri'
              }
            }
          }
        },
      },
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
  };

  // Swagger doküman oluşturma
  const swaggerSpec = swaggerJsdoc(swaggerOptions) as OAS3Definition;
  
  // API yollarını düzeltme - Route'ların başına /api eklemek
  if (swaggerSpec && swaggerSpec.paths) {
    const updatedPaths: { [key: string]: any } = {};
    
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