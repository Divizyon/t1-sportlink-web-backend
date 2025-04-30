import { Request, Response } from 'express';
import * as eventService from '../services/eventService';
import { UpdateEventStatusSchema, EventNotFoundError, EventPermissionError, EventStatusError, EventValidationError } from '../models/Event';
import logger from '../utils/logger';
import { EventValidationSchema } from '../models/Event';
import supabase, { supabaseAdmin } from '../config/supabase';
import { NotificationService } from '../services/NotificationService';

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
      // Status validasyonu 
      const statusValidation = UpdateEventStatusSchema.safeParse({ status });
      if (!statusValidation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Geçersiz etkinlik durumu.'
        });
      }
      
      // Etkinlik durumunu güncelle
      const updatedEvent = await eventService.updateEventStatus(id, status, userId);
      
      console.log("Etkinlik durumu güncellendi:", updatedEvent);
      
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
      
      if (error instanceof EventStatusError) {
        return res.status(400).json({
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

        // Etkinlik oluşturulduğunda adminlere bildirim gönder
        try {
          // Kullanıcı bilgilerini al
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
            
          const creatorName = userData 
            ? `${userData.first_name} ${userData.last_name}`
            : 'Bilinmeyen Kullanıcı';
            
          // Adminlere bildirim gönder
          const notificationService = new NotificationService();
          await notificationService.notifyAdminsNewEvent(
            newEvent.id,
            newEvent.title,
            creatorName
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
    console.log('Tüm etkinlikler istendi');
    
    // Etkinlikleri getir
    const events = await eventService.getAllEvents();
    
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
    console.log(`Etkinlik detayı istendi: ${id}`);
    
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
    
    // Kullanıcı ID'si varsa al (req.user auth middleware ile set edilmiş olmalı)
    const userId = req.user?.id;
    logger.info(`Kullanıcı durumu: ${userId ? 'Giriş yapmış' : 'Giriş yapmamış'}`);
    
    // Bugünkü etkinlikleri getir
    const events = await eventService.getTodayEvents(userId);
    
    res.status(200).json({
      status: 'success',
      data: events
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
      // Etkinliği güncelle
      const updatedEvent = await eventService.updateEvent(id, req.body, userId);
      
      // Etkinlik güncellendiğinde adminlere bildirim gönder
      try {
        // Kullanıcı bilgilerini al
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
          
        const updaterName = userData 
          ? `${userData.first_name} ${userData.last_name}`
          : 'Bilinmeyen Kullanıcı';
          
        // Adminlere bildirim gönder
        const notificationService = new NotificationService();
        await notificationService.notifyAdminsEventUpdated(
          parseInt(id),
          updatedEvent.title,
          updaterName
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
      // Etkinliği sil
      const result = await eventService.deleteEvent(id, userId);
      
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