import { Request, Response } from 'express';
import * as eventService from '../services/eventService';
import { UpdateEventStatusSchema, EventNotFoundError, EventPermissionError, EventStatusError, EventValidationError } from '../models/Event';
import logger from '../utils/logger';
import { EventValidationSchema } from '../models/Event';
import supabase, { supabaseAdmin } from '../config/supabase';
import { NotificationService } from '../services/NotificationService';
import { SportsService } from '../services/SportsService';
import { SecurityLogService } from '../services/securityLogService';
import { handleError } from '../utils/errorHandler';

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Oturum açmış kullanıcının kimliğini al
    const userId = req.userProfile?.id;
    
    // Kullanıcı kimliği kontrolü
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    console.log(`Etkinlik durumu güncelleme isteği: eventId=${id}, status=${status}`);
    
    try {
      // Status şemasını doğrula
      const statusValidation = UpdateEventStatusSchema.safeParse({ status });
      if (!statusValidation.success) {
        return res.status(400).json({
          status: 'error',
          message: `Geçersiz durum: ${statusValidation.error.message}`
        });
      }
      
      // Etkinliği bul
      const event = await eventService.findEventById(id);
      if (!event) {
        return res.status(404).json({
          status: 'error',
          message: 'Etkinlik bulunamadı'
        });
      }
      
      // Önceki durum
      const oldStatus = event.status;
      
      // Etkinlik durumunu güncelle
      const updatedEvent = await eventService.updateEventStatus(id, status, userId);
      
      // Admin bilgilerini al
      const { data: adminData } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      
      const adminEmail = adminData?.email || 'bilinmeyen@mail.com';
      const adminName = adminData ? `${adminData.first_name} ${adminData.last_name}` : 'Bilinmeyen Admin';
      
      // IP adresi al
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      
      // Log oluştur
      await SecurityLogService.createLog({
        admin_id: userId,
        admin_username: adminName,
        type: 'event_status_update',
        ip_address: ip,
        details: {
          event_id: id,
          title: event.title,
          old_status: oldStatus,
          new_status: status
        },
        action: `Etkinlik durumu: ${oldStatus} → ${status} / ${adminEmail} / etkinlik: ${event.title} (#${id})`
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          event: updatedEvent
        }
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error instanceof EventStatusError) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error instanceof EventPermissionError) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      console.error('Etkinlik durumu güncelleme hatası:', error);
      throw error;
    }
  } catch (error) {
    console.error('Etkinlik durumu güncelleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik durumu güncellenirken bir hata oluştu.'
    });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    // Oturum açmış kullanıcının kimliğini al
    const userId = req.userProfile?.id;
    
    // Kullanıcı kimliği kontrolü
    if (!userId) {
      logger.error("Etkinlik oluşturma hatası: Kullanıcı kimliği bulunamadı", { 
        auth: req.headers.authorization ? "Bearer token var" : "Bearer token yok",
        reqUser: JSON.stringify(req.user || "undefined"),
        reqUserProfile: JSON.stringify(req.userProfile || "undefined")
      });
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    try {
      logger.info("Etkinlik oluşturma isteği:", req.body);
      logger.info(`Kullanıcı ID: ${userId}, Tip: ${typeof userId}`);
      
      // Veritabanında kullanıcı kontrolü
      try {
        logger.info(`Veritabanında kullanıcı kontrolü başlatılıyor: ${userId}`);
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name')
          .eq('id', userId)
          .single();
          
        if (userError) {
          logger.error(`Error finding user by ID: ${JSON.stringify(userError, null, 2)}`);
        }
        
        if (!userData) {
          logger.warn(`Kullanıcı veritabanında bulunamadı: ${userId}`);
          return res.status(404).json({
            status: 'error',
            message: 'Kullanıcı profili bulunamadı. Profil bilgilerinizi tamamlayıp tekrar deneyin.'
          });
        } else {
          logger.info(`Kullanıcı veritabanında bulundu: ${JSON.stringify(userData)}`);
        }
      } catch (userCheckError) {
        logger.error(`Kullanıcı kontrolü hatası: ${userCheckError instanceof Error ? userCheckError.message : 'Bilinmeyen hata'}`);
      }
      
      // Gelen veriyi kontrol et
      const { title, description, sport_id, event_date, start_time, end_time, 
              location_name, location_lat, location_long, max_participants } = req.body;
      
      // Veri tiplerini kontrol et
      logger.info("Veri tipleri:", {
        sport_id: typeof sport_id === 'string' ? `string: ${sport_id}` : typeof sport_id,
        location_lat: typeof location_lat === 'string' ? `string: ${location_lat}` : typeof location_lat,
        location_long: typeof location_long === 'string' ? `string: ${location_long}` : typeof location_long,
        max_participants: typeof max_participants === 'string' ? `string: ${max_participants}` : typeof max_participants
      });
      
      // Zorunlu alanları kontrol et
      if (!title || !sport_id || !event_date || !start_time || !end_time || 
          !location_name || !max_participants) {
        logger.error("Eksik alan hatası:", {
          title: !!title, 
          sport_id: !!sport_id, 
          event_date: !!event_date, 
          start_time: !!start_time, 
          end_time: !!end_time, 
          location_name: !!location_name, 
          max_participants: !!max_participants
        });
        return res.status(400).json({
          status: 'error',
          message: 'Tüm zorunlu alanları doldurun.'
        });
      }
      
      // Tarih tiplerini kontrol et
      try {
        logger.info("Tarih formatları:", {
          event_date_raw: event_date,
          event_date_valid: !isNaN(Date.parse(event_date)),
          start_time_raw: start_time,
          start_time_valid: !isNaN(Date.parse(start_time)),
          end_time_raw: end_time,
          end_time_valid: !isNaN(Date.parse(end_time))
        });
      } catch (dateError) {
        logger.error(`Tarih doğrulama hatası: ${dateError instanceof Error ? dateError.message : 'Bilinmeyen hata'}`);
      }
      
      // Supabase servis anahtarı bilgisi (hassas bilgi)
      const supabaseURLExists = !!process.env.SUPABASE_URL;
      const supabaseKeyExists = !!process.env.SUPABASE_SERVICE_KEY;
      logger.info(`Supabase yapılandırma kontrolü: URL=${supabaseURLExists ? 'Mevcut' : 'Eksik'}, ServiceKey=${supabaseKeyExists ? 'Mevcut' : 'Eksik'}`);
      
      // Etkinliği oluştur
      const newEventData = {
        ...req.body,
        creator_id: userId  // UUID formatında kullanıcı ID'si
      };
      
      logger.info(`Servise gönderilecek veri: ${JSON.stringify(newEventData, null, 2)}`);
      
      try {
        const newEvent = await eventService.createEvent(newEventData);
        logger.info("Etkinlik başarıyla oluşturuldu:", newEvent);

        // Kullanıcı bilgilerini al
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('email, first_name, last_name, role')
          .eq('id', userId)
          .single();
        
        const userEmail = userData?.email || 'bilinmeyen@mail.com';
        const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'Bilinmeyen Kullanıcı';
        const userRole = userData?.role || 'USER';
        
        // IP adresi al
        const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
        
        // Spor adını al
        let sportName = '';
        if (newEventData.sport_id) {
          try {
            const sport = await SportsService.getSportById(newEventData.sport_id);
            sportName = sport?.name || 'Bilinmeyen Spor';
          } catch (error) {
            logger.error('Spor adı alınırken hata:', error);
          }
        }
        
        // Güvenlik log kaydı oluştur (önemli etkinlik değişikliklerini izlemek için)
        await SecurityLogService.createLog({
          admin_id: userId,
          admin_username: userName,
          type: 'event_create',
          ip_address: ip,
          details: {
            event_id: newEvent.id,
            title: newEvent.title,
            sport_name: sportName,
            user_role: userRole
          },
          action: `Etkinlik oluşturuldu / ${userEmail} / etkinlik: ${newEvent.title} (#${newEvent.id}) / spor: ${sportName}`
        });

        // Etkinlik oluşturulduğunda adminlere bildirim gönder
        try {
          // Adminlere bildirim gönder
          const notificationService = new NotificationService();
          await notificationService.notifyAdminsNewEvent(
            newEvent.id,
            newEvent.title,
            userName
          );
          logger.info(`Yeni etkinlik bildirimi gönderildi: ${newEvent.title}`);
        } catch (notificationError) {
          logger.error('Bildirim gönderirken hata oluştu:', notificationError);
          // Ana işlemi etkilememesi için hata fırlatmıyoruz
        }

        // Başarılı yanıt
        return res.status(201).json({
          status: 'success',
          data: {
            event: newEvent
          }
        });
      } catch (serviceError) {
        logger.error(`Etkinlik servis hatası: ${serviceError instanceof Error ? serviceError.message : 'Bilinmeyen hata'}`, {
          stack: serviceError instanceof Error ? serviceError.stack : 'Stack yok'
        });
        
        // PostgreSQL hata kodlarını kontrol et
        if (serviceError instanceof Error && serviceError.message.includes('23503')) {
          logger.error("Foreign key hatası - Veritabanı ilişki hatası");
        }
        
        if (serviceError instanceof Error && serviceError.message.includes('22P02')) {
          logger.error("Veri tipi hatası - Geçersiz veri türü dönüşümü");
        }
        
        throw serviceError;
      }
    } catch (error: any) {
      logger.error(`Etkinlik oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, {
        stack: error instanceof Error ? error.stack : 'Stack yok'
      });
      
      // Hata mesajlarını işle
      if (error instanceof EventValidationError) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message && error.message.includes('validation')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message && error.message.includes('Geçersiz veri türü')) {
        return res.status(400).json({
          status: 'error',
          message: 'Veri tipleri geçersiz. Lütfen girdiğiniz değerleri kontrol edin.'
        });
      }
      
      if (error.message && error.message.includes('Geçersiz ilişki')) {
        return res.status(400).json({
          status: 'error',
          message: 'Girdiğiniz sport_id veya diğer ilişkisel alanlar geçersiz.'
        });
      }

      throw error;
    }
  } catch (error) {
    logger.error(`Etkinlik oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, {
      stack: error instanceof Error ? error.stack : 'Stack yok'
    });
    return res.status(500).json({
      status: 'error',
      message: 'Etkinlik oluşturulurken bir hata oluştu.'
    });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    // Kullanıcı bilgisini al
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    console.log(`Tüm etkinlikler istendi (Kullanıcı: ${userId})`);
    
    // Etkinlikleri getir (kullanıcı ID'si ile)
    const events = await eventService.getAllEvents(userId);
    
    console.log(`${events.length} etkinlik bulundu`);
    
    res.status(200).json({
      status: 'success',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Etkinlikleri getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    console.log(`Etkinlik detayı istendi: ${id}, İsteyen kullanıcı: ${userId}`);
    
    try {
      // Etkinliği getir
      const event = await eventService.findEventById(id);
      
      console.log(`Etkinlik bulundu: ${id}`);
      
      res.status(200).json({
        status: 'success',
        data: {
          event
        }
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Etkinlik detayı getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik detayı getirilirken bir hata oluştu.'
    });
  }
};

/**
 * @swagger
 * /api/events/today:
 *   get:
 *     summary: Bugünkü aktif etkinliklerin listesini döndürür
 *     description: Bugüne ait aktif etkinliklerin listesini frontend formatında döndürür. Token olmadan da kullanılabilir.
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Sayfa numarası (opsiyonel, varsayılan değer 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Sayfa başına etkinlik sayısı (opsiyonel, varsayılan değer 10)
 *     responses:
 *       200:
 *         description: Başarılı yanıt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 *                 totalEvents:
 *                   type: integer
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayEvent'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 */
export const getTodayEvents = async (req: Request, res: Response) => {
  try {
    logger.info('Bugünkü etkinlikler istendi');
    
    // Sayfalama parametrelerini al (varsayılan: sayfa 1, sayfa başına 10 öğe)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Kullanıcı ID'si varsa al (req.user auth middleware ile set edilmiş olmalı)
    const userId = req.user?.id;
    logger.info(`Kullanıcı durumu: ${userId ? 'Giriş yapmış' : 'Giriş yapmamış'}, Sayfa: ${page}, Limit: ${limit}`);
    
    // Bugünkü etkinlikleri getir (sayfalama ile)
    const todayEventsData = await eventService.getTodayEvents(userId, page, limit);
    
    res.status(200).json({
      status: 'success',
      results: todayEventsData.events.length,
      page,
      totalPages: todayEventsData.totalPages,
      totalEvents: todayEventsData.totalEvents,
      data: todayEventsData.events
    });
  } catch (error) {
    logger.error('Bugünkü etkinlikleri getirirken hata oluştu:', error);
    res.status(500).json({
      status: 'error',
      message: 'Bugünkü etkinlikleri getirirken bir hata oluştu.'
    });
  }
};

/**
 * Etkinliği günceller
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    try {
      // Önce mevcut etkinlik bilgilerini al
      const existingEvent = await eventService.findEventById(id);
      if (!existingEvent) {
        return res.status(404).json({
          status: 'error',
          message: 'Etkinlik bulunamadı'
        });
      }
      
      // Kullanıcının bu etkinliği güncelleme yetkisi var mı kontrol et
      if (existingEvent.creator_id !== userId) {
        // Kullanıcı rolünü kontrol et
        const isAdmin = await eventService.isUserAdmin(userId);
        if (!isAdmin) {
          return res.status(403).json({
            status: 'error',
            message: 'Bu etkinliği güncelleme yetkiniz bulunmamaktadır. Sadece kendi oluşturduğunuz etkinlikleri güncelleyebilirsiniz.'
          });
        }
      }
      
      // Değişen alanları ve değerleri tespit et
      const updatedFields: string[] = [];
      const changedValues: Record<string, { old: any; new: any }> = {};
      
      for (const key in req.body) {
        if (existingEvent[key] !== req.body[key]) {
          updatedFields.push(key);
          changedValues[key] = {
            old: existingEvent[key],
            new: req.body[key]
          };
        }
      }
      
      // Etkinliği güncelle
      const updatedEvent = await eventService.updateEvent(id, req.body, userId);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name, role')
        .eq('id', userId)
        .single();
      
      const userEmail = userData?.email || 'bilinmeyen@mail.com';
      const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'Bilinmeyen Kullanıcı';
      const userRole = userData?.role || 'USER';
      
      // IP adresi al
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      
      // Sport ID değiştiyse spor adını da al
      let sportName = '';
      if (updatedFields.includes('sport_id') && req.body.sport_id) {
        try {
          const sport = await SportsService.getSportById(req.body.sport_id);
          sportName = sport?.name || 'Bilinmeyen Spor';
          
          // Eski spor adını da al
          const oldSport = await SportsService.getSportById(existingEvent.sport_id);
          const oldSportName = oldSport?.name || 'Bilinmeyen Spor';
          changedValues['sport_id'] = {
            old: oldSportName,
            new: sportName
          };
        } catch (error) {
          logger.error('Spor adı alınırken hata:', error);
        }
      }
      
      // Log oluştur - Detaylı formatta
      let logAction = `Etkinlik güncellendi / ${userEmail} / etkinlik: ${updatedEvent.title} (#${id})`;
      
      // Değişen alan sayısına göre action string'ini güncelle
      if (updatedFields.length > 0) {
        // Türkçe alan adları için çeviri tablosu
        const fieldNameTranslations: Record<string, string> = {
          title: "Başlık",
          description: "Açıklama",
          location_name: "Konum",
          event_date: "Tarih",
          start_time: "Başlangıç saati",
          end_time: "Bitiş saati",
          max_participants: "Kapasite",
          sport_id: "Spor türü", 
          status: "Durum",
          image_url: "Resim"
        };
        
        // Değişiklikleri detaylı formatta hazırla
        const detailedChanges = updatedFields.map(field => {
          const fieldName = fieldNameTranslations[field] || field;
          
          // sport_id için özel işlem - spor adlarını göster
          if (field === 'sport_id' && changedValues[field]) {
            return `${fieldName}: ${changedValues[field].old} → ${changedValues[field].new}`;
          }
          
          // Diğer alanlar için normal değişim bilgisi
          const oldValue = changedValues[field]?.old !== undefined ? changedValues[field].old : 'boş';
          const newValue = changedValues[field]?.new !== undefined ? changedValues[field].new : 'boş';
          
          // Uzun içeriklerde kısaltma yap
          const formatValue = (value: any): string => {
            if (typeof value === 'string' && value.length > 20) {
              return value.substring(0, 17) + '...';
            }
            return String(value);
          };
          
          return `${fieldName}: ${formatValue(oldValue)} → ${formatValue(newValue)}`;
        });
        
        // 3'ten fazla alan değiştiyse ilk 3'ünü detaylı göster, diğerlerini say
        if (updatedFields.length > 3) {
          logAction += ` • ${updatedFields.length} alan değişti • ${detailedChanges.slice(0, 3).join(" • ")}...`;
        } else {
          logAction += ` • ${detailedChanges.join(" • ")}`;
        }
      }
      
      // Log kaydı oluştur
      await SecurityLogService.createLog({
        admin_id: userId,
        admin_username: userName,
        type: 'event_update',
        ip_address: ip,
        details: {
          event_id: id,
          title: updatedEvent.title,
          updated_fields: updatedFields,
          changed_values: changedValues,
          sport_name: sportName || undefined,
          user_role: userRole
        },
        action: logAction
      });
      
      // Etkinlik güncellendiğinde adminlere bildirim gönder
      try {
        // Adminlere bildirim gönder
        const notificationService = new NotificationService();
        await notificationService.notifyAdminsEventUpdated(
          parseInt(id),
          updatedEvent.title,
          userName
        );
        logger.info(`Etkinlik güncelleme bildirimi gönderildi: ${updatedEvent.title}`);
      } catch (notificationError) {
        logger.error('Bildirim gönderirken hata oluştu:', notificationError);
        // Ana işlemi etkilememesi için hata fırlatmıyoruz
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          event: updatedEvent
        }
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error instanceof EventPermissionError) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error instanceof EventValidationError) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      logger.error('Etkinlik güncelleme hatası:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Etkinlik güncelleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Etkinliği siler
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Oturum açmış kullanıcının kimliğini al
    const userId = req.userProfile?.id;
    
    // Kullanıcı kimliği kontrolü
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    logger.info(`Etkinlik silme isteği: eventId=${id}, userId=${userId}`);
    
    try {
      // Etkinlik bilgilerini al (silmeden önce)
      const event = await eventService.findEventById(id);
      if (!event) {
        return res.status(404).json({
          status: 'error',
          message: 'Etkinlik bulunamadı'
        });
      }
      
      // Kullanıcının bu etkinliği silme yetkisi var mı kontrol et
      if (event.creator_id !== userId) {
        // Kullanıcı rolünü kontrol et
        const isAdmin = await eventService.isUserAdmin(userId);
        if (!isAdmin) {
          return res.status(403).json({
            status: 'error',
            message: 'Bu etkinliği silme yetkiniz bulunmamaktadır. Sadece kendi oluşturduğunuz etkinlikleri silebilirsiniz.'
          });
        }
      }
      
      // Etkinliği sil
      const result = await eventService.deleteEvent(id, userId);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name, role')
        .eq('id', userId)
        .single();
      
      const userEmail = userData?.email || 'bilinmeyen@mail.com';
      const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'Bilinmeyen Kullanıcı';
      const userRole = userData?.role || 'USER';
      
      // Log oluştur
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      
      await SecurityLogService.createLog({
        admin_id: userId,
        admin_username: userName,
        type: 'event_delete',
        ip_address: ip,
        details: {
          event_id: id,
          title: event.title,
          user_role: userRole
        },
        action: `Etkinlik silindi / ${userEmail} / etkinlik: ${event.title} (#${id})`
      });
      
      logger.info(`Etkinlik silindi: ${id}`);
      
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error instanceof EventPermissionError) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      logger.error('Etkinlik silme hatası:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Etkinlik silme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik silinirken bir hata oluştu.'
    });
  }
};

export const getPendingEvents = async (req: Request, res: Response) => {
  try {
    // Sayfalama parametrelerini al (varsayılan: sayfa 1, sayfa başına 10 öğe)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Kullanıcı ID'sini al (opsiyonel filtre olarak)
    const userId = req.query.userId as string || undefined;
    
    logger.info(`Onay bekleyen etkinlikler isteniyor. Sayfa: ${page}, Limit: ${limit}`);
    
    const pendingEvents = await eventService.getEventsByStatus('pending', {
      page,
      limit,
      userId,
    });
    
    res.status(200).json({
      status: 'success',
      results: pendingEvents.events.length,
      page,
      totalPages: pendingEvents.totalPages,
      totalEvents: pendingEvents.totalEvents,
      data: {
        events: pendingEvents.events
      }
    });
  } catch (error) {
    logger.error('Onay bekleyen etkinlikler alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Onay bekleyen etkinlikler alınırken bir hata oluştu.'
    });
  }
};

export const getActiveEvents = async (req: Request, res: Response) => {
  try {
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Kullanıcı ID'sini al (opsiyonel filtre olarak)
    const userId = req.query.userId as string || undefined;
    
    logger.info(`Aktif etkinlikler isteniyor. Sayfa: ${page}, Limit: ${limit}`);
    
    const activeEvents = await eventService.getEventsByStatus('active', {
      page,
      limit,
      userId,
    });
    
    res.status(200).json({
      status: 'success',
      results: activeEvents.events.length,
      page,
      totalPages: activeEvents.totalPages,
      totalEvents: activeEvents.totalEvents,
      data: {
        events: activeEvents.events
      }
    });
  } catch (error) {
    logger.error('Aktif etkinlikler alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Aktif etkinlikler alınırken bir hata oluştu.'
    });
  }
};

export const getRejectedEvents = async (req: Request, res: Response) => {
  try {
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Kullanıcı ID'sini al (opsiyonel filtre olarak)
    const userId = req.query.userId as string || undefined;
    
    logger.info(`Reddedilen etkinlikler isteniyor. Sayfa: ${page}, Limit: ${limit}`);
    
    const rejectedEvents = await eventService.getEventsByStatus('rejected', {
      page,
      limit,
      userId,
    });
    
    res.status(200).json({
      status: 'success',
      results: rejectedEvents.events.length,
      page,
      totalPages: rejectedEvents.totalPages,
      totalEvents: rejectedEvents.totalEvents,
      data: {
        events: rejectedEvents.events
      }
    });
  } catch (error) {
    logger.error('Reddedilen etkinlikler alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Reddedilen etkinlikler alınırken bir hata oluştu.'
    });
  }
};

export const getCompletedEvents = async (req: Request, res: Response) => {
  try {
    // Sayfalama parametrelerini al
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Kullanıcı ID'sini al (opsiyonel filtre olarak)
    const userId = req.query.userId as string || undefined;
    
    logger.info(`Tamamlanan etkinlikler isteniyor. Sayfa: ${page}, Limit: ${limit}`);
    
    const completedEvents = await eventService.getEventsByStatus('completed', {
      page,
      limit,
      userId,
    });
    
    res.status(200).json({
      status: 'success',
      results: completedEvents.events.length,
      page,
      totalPages: completedEvents.totalPages,
      totalEvents: completedEvents.totalEvents,
      data: {
        events: completedEvents.events
      }
    });
  } catch (error) {
    logger.error('Tamamlanan etkinlikler alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tamamlanan etkinlikler alınırken bir hata oluştu.'
    });
  }
};

/**
 * Farklı durumlardaki etkinliklerin sayılarını getiren endpoint handler
 * @param req Express Request
 * @param res Express Response
 */
export const getEventCounts = async (req: Request, res: Response) => {
  try {
    // Kullanıcı ID'si (opsiyonel)
    const userId = req.query.userId as string | undefined;
    
    logger.info(`Etkinlik sayıları isteniyor. Kullanıcı filtresi: ${userId || 'Yok'}`);
    
    // Etkinlik sayılarını getir
    const counts = await eventService.getEventCounts(userId);
    
    // Başarılı yanıt
    res.status(200).json({
      status: 'success',
      data: counts
    });
  } catch (error) {
    logger.error('Etkinlik sayıları alınırken hata oluştu:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik sayıları alınırken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcı etkinliğe katılır
 */
export const joinEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    logger.info(`Etkinliğe katılma isteği: eventId=${id}, userId=${userId}`);

    try {
      const result = await eventService.joinEvent(id, userId);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      
      const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'Bilinmeyen Kullanıcı';
      
      // Etkinlik bilgilerini al
      const event = await eventService.findEventById(id);
      
      // Etkinlik sahibine bildirim gönder (isteğe bağlı)
      try {
        const notificationService = new NotificationService();
        await notificationService.notifyEventOwner(
          event.creator_id,
          event.id,
          event.title,
          userName,
          'join'
        );
        logger.info(`Etkinlik sahibine katılım bildirimi gönderildi: eventId=${id}`);
      } catch (notificationError) {
        logger.error('Bildirim gönderirken hata oluştu:', notificationError);
        // Ana işlemi etkilememesi için hata fırlatmıyoruz
      }

      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Etkinliğe katılma hatası: ${error.message}`);
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Etkinliğe katılma hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Etkinliğe katılırken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcı etkinlikten ayrılır
 */
export const leaveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    logger.info(`Etkinlikten ayrılma isteği: eventId=${id}, userId=${userId}`);

    try {
      const result = await eventService.leaveEvent(id, userId);
      
      // Kullanıcı bilgilerini al
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      
      const userName = userData ? `${userData.first_name} ${userData.last_name}` : 'Bilinmeyen Kullanıcı';
      
      // Etkinlik bilgilerini al
      const event = await eventService.findEventById(id);
      
      // Etkinlik sahibine bildirim gönder (isteğe bağlı)
      try {
        const notificationService = new NotificationService();
        await notificationService.notifyEventOwner(
          event.creator_id,
          event.id,
          event.title,
          userName,
          'leave'
        );
        logger.info(`Etkinlik sahibine ayrılma bildirimi gönderildi: eventId=${id}`);
      } catch (notificationError) {
        logger.error('Bildirim gönderirken hata oluştu:', notificationError);
        // Ana işlemi etkilememesi için hata fırlatmıyoruz
      }

      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Etkinlikten ayrılma hatası: ${error.message}`);
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Etkinlikten ayrılma hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Etkinlikten ayrılırken bir hata oluştu.'
    });
  }
};

/**
 * Etkinliğin katılımcılarını getirir
 */
export const getEventParticipants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    logger.info(`Etkinlik katılımcıları isteniyor: ${id}, isteyen kullanıcı: ${userId}`);
    
    try {
      // Etkinliği kontrol et (hem etkinliğin varlığını hem de kullanıcının erişim hakkı olup olmadığını)
      const event = await eventService.findEventById(id);
      
      // Etkinlik katılımcılarını getir
      const participants = await eventService.getEventParticipants(id);
      
      return res.status(200).json({
        status: 'success',
        results: participants.length,
        data: {
          participants
        }
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Etkinlik katılımcıları getirme hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Etkinlik katılımcıları getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcının katıldığı etkinlikleri getirir
 */
export const getUserParticipatedEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    logger.info(`Kullanıcının katıldığı etkinlikleri getirme isteği: userId=${userId}, page=${page}, limit=${limit}, status=${status || 'all'}`);

    try {
      const result = await eventService.getUserParticipatedEvents(userId, page, limit, status);
      
      return res.status(200).json({
        status: 'success',
        results: result.events.length,
        data: {
          events: result.events,
          meta: result.meta
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Kullanıcının katıldığı etkinlikleri getirme hatası: ${error.message}`);
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Kullanıcının katıldığı etkinlikleri getirme hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Kullanıcının katıldığı etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcının oluşturduğu etkinlikleri getirir
 */
export const getUserCreatedEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    logger.info(`Kullanıcının oluşturduğu etkinlikleri getirme isteği: userId=${userId}, page=${page}, limit=${limit}, status=${status || 'all'}`);

    try {
      const result = await eventService.getUserCreatedEvents(userId, page, limit, status);
      
      return res.status(200).json({
        status: 'success',
        results: result.events.length,
        data: {
          events: result.events,
          meta: result.meta
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Kullanıcının oluşturduğu etkinlikleri getirme hatası: ${error.message}`);
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Kullanıcının oluşturduğu etkinlikleri getirme hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Kullanıcının oluşturduğu etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

export const getNearbyEvents = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, distance = 1 } = req.query;
    
    // Üretim ortamı için test modu kapalı
    const SWAGGER_TEST_MODE = false; // Üretim ortamında false olmalıdır
    
    // Kullanıcı oturum kontrolü
    const userId = req.userProfile?.id || req.user?.id;
    const hasToken = !!req.query.token; // URL'den token var mı?
    
    // Kimlik doğrulama kontrolü
    const isAuthorized = SWAGGER_TEST_MODE || !!userId || hasToken;
    
    // Kimlik doğrulama kontrolü (üretim ortamında)
    if (!isAuthorized) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    // Koordinat kontrolü
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Konum bilgisi gereklidir (latitude ve longitude parametreleri)'
      });
    }
    
    const userLat = parseFloat(latitude as string);
    const userLng = parseFloat(longitude as string);
    const searchRadius = parseFloat(distance as string);
    
    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçersiz koordinat veya mesafe değeri'
      });
    }
    
    const events = await eventService.getNearbyEvents(userLat, userLng, searchRadius);
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: { events }
    });
    
  } catch (error) {
    console.error('Nearby API hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    handleError(error as Error, res);
  }
};

/**
 * Kullanıcıyı etkinliğe davet eder
 */
export const inviteUserToEvent = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { inviteeId } = req.body;
    const inviterId = req.user?.id;

    logger.info(`Etkinliğe davet isteği: eventId=${eventId}, inviterId=${inviterId}, inviteeId=${inviteeId}`);

    // Gerekli alanların kontrolü
    if (!inviterId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    if (!inviteeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Davet edilecek kullanıcı IDsi gereklidir.'
      });
    }

    // Kullanıcının kendisini davet etmesini engelle
    if (inviterId === inviteeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Kendinizi etkinliğe davet edemezsiniz.'
      });
    }

    try {
      const result = await eventService.inviteUserToEvent(eventId, inviterId, inviteeId);
      
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(`Etkinliğe davet hatası: ${error.message}`);
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Etkinliğe davet hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Etkinliğe davet gönderilirken bir hata oluştu.'
    });
  }
}; 