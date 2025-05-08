import { Event, EventStatus, EventValidationSchema, UpdateEventStatusSchema, EventValidationError, EventNotFoundError, EventPermissionError, EventStatusError, TodayEvent } from '../models/Event';
import supabase, { supabaseAdmin } from '../config/supabase';
import { parseISO, addHours, isBefore, isAfter, startOfDay, endOfDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import logger from '../utils/logger';
import { BadRequestError, NotFoundError } from '../errors/customErrors';
import { getSupabaseForToken } from '../config/supabaseClient';

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

const convertToUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

const convertFromUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

/**
 * Etkinlik verilerini standart formata dönüştürür.
 * @param event Etkinlik verisi
 * @param sportData Spor verisi (opsiyonel)
 * @returns Standart formatta etkinlik verisi
 */
export const formatEvent = (event: any, sportData?: any): any => {
  if (!event) return null;
  
  // Sport bilgisini hazırla
  const sport = sportData || {
    id: event.sport_id || event.sport?.id,
    icon: event.sport?.icon || "⚽", // Varsayılan ikon
    name: event.sport?.name || event.sport_category || "Diğer",
    description: event.sport?.description || ""
  };
  
  // Creator bilgilerini hazırla
  const creator = event.creator || {};
  const creator_name = creator.first_name && creator.last_name 
    ? `${creator.first_name} ${creator.last_name}`
    : 'Anonim';

  // Katılımcı sayısını hesapla
  const current_participants = event.participants?.[0]?.count || 0;
  const is_full = current_participants >= (event.max_participants || 0);
  
  // Standart formatta etkinlik nesnesi döndür
  return {
    id: event.id,
    sport_id: event.sport_id,
    title: event.title,
    description: event.description,
    event_date: event.event_date,
    start_time: event.start_time,
    end_time: event.end_time,
    location_name: event.location_name,
    location_latitude: event.location_latitude,
    location_longitude: event.location_longitude,
    max_participants: event.max_participants,
    status: event.status,
    created_at: event.created_at,
    updated_at: event.updated_at,
    creator_id: event.creator_id,
    creator_name: creator_name,
    creator_role: creator.role || 'USER',
    current_participants,
    is_full,
    sport,
    sport_category: sport.name
  };
};

export const findEventById = async (id: string): Promise<any> => {
  try {
    logger.info(`Etkinlik aranıyor: ${id}`);
    
    // Etkinlik verisi ile birlikte spor, creator ve katılımcı verilerini al
    const { data, error } = await supabaseAdmin
      .from('Events')
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*),
        creator:users!Events_creator_id_fkey(
          id,
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error(`Etkinlik arama hatası: ${error.message}`, error);
      throw new EventNotFoundError(id);
    }

    if (!data) {
      logger.error(`Etkinlik bulunamadı: ${id}`);
      throw new EventNotFoundError(id);
    }

    logger.info(`Etkinlik bulundu: ${id}`, {
      creator: data.creator,
      participantCount: data.participants?.[0]?.count
    });
    
    // Standart formata dönüştür
    return formatEvent(data);
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      throw error;
    }
    logger.error('Find event error:', error);
    throw new Error('Etkinlik aranırken bir hata oluştu.');
  }
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Check admin error:', error);
      throw new Error('Kullanıcı rolü kontrol edilirken bir hata oluştu.');
    }

    return data?.role === 'ADMIN';
  } catch (error) {
    console.error('Admin check error:', error);
    throw error;
  }
};

export const canUpdateEventStatus = async (userId: string, event: Event): Promise<boolean> => {
  try {
    // Admin kontrolü
    const isAdmin = await isUserAdmin(userId);

    // Admin her türlü durumu değiştirebilir
    if (isAdmin) return true;

    // Admin olmayan kullanıcılar için kısıtlamalar:
    // 1. Sadece kendi etkinliklerini güncelleyebilirler
    if (userId !== event.creator_id) {
      logger.info(`Yetki reddedildi: Kullanıcı (${userId}) etkinliğin sahibi (${event.creator_id}) değil.`);
      return false;
    }

    // 2. PENDING durumundaki etkinlikleri değiştiremezler (admin onayı beklenirken)
    if (event.status === EventStatus.PENDING) {
      logger.info(`Yetki reddedildi: Etkinlik (${event.id}) onay bekliyor, güncellenemez.`);
      return false;
    }

    // 3. REJECTED durumundaki etkinlikleri değiştiremezler
    if (event.status === EventStatus.REJECTED) {
      logger.info(`Yetki reddedildi: Etkinlik (${event.id}) reddedildi, güncellenemez.`);
      return false;
    }

    // Diğer durumlar için etkinlik sahibi değişiklik yapabilir
    logger.info(`Yetki verildi: Kullanıcı (${userId}) kendi etkinliğini (${event.id}) güncelleyebilir.`);
    return true;
  } catch (error) {
    logger.error('Permission check error:', error);
    throw new EventPermissionError('Yetki kontrolü yapılırken bir hata oluştu.');
  }
};

export const validateStatusUpdate = async (
  event: Event,
  newStatus: EventStatus
): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Etkinliğin durumu zaten bu ise değiştirmeye gerek yok
    if (event.status === newStatus) {
      return { isValid: false, message: 'Etkinlik zaten bu durumda.' };
    }

    // Tamamlanmış veya reddedilmiş etkinlik durumu değiştirilemez
    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.REJECTED) {
      return { isValid: false, message: `${event.status === EventStatus.COMPLETED ? 'Tamamlanmış' : 'Reddedilmiş'} etkinliğin durumu değiştirilemez.` };
    }

    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    // PENDING durumundan geçiş kontrolleri
    if (event.status === EventStatus.PENDING) {
      // PENDING -> ACTIVE veya REJECTED (sadece admin)
      if (newStatus === EventStatus.ACTIVE || newStatus === EventStatus.REJECTED) {
        return { isValid: true, message: '' };
      }
      return { isValid: false, message: 'Bekleyen etkinlik sadece onaylanabilir veya reddedilebilir.' };
    }

    // ACTIVE durumundan geçiş kontrolleri
    if (event.status === EventStatus.ACTIVE) {
      // ACTIVE -> CANCELLED (etkinlik başlamadan önce)
      if (newStatus === EventStatus.CANCELLED) {
        return { isValid: true, message: '' };
      }

      // ACTIVE -> COMPLETED (etkinlik başladıktan sonra)
      if (newStatus === EventStatus.COMPLETED) {
        if (startTime > now) {
          return { 
            isValid: false, 
            message: 'Etkinlik henüz başlamadı, tamamlandı olarak işaretlenemez.' 
          };
        }
        return { isValid: true, message: '' };
      }
    }

    // CANCELLED durumundan geçiş kontrolleri
    if (event.status === EventStatus.CANCELLED) {
      // CANCELLED -> ACTIVE (sadece etkinlik başlamadan önce)
      if (newStatus === EventStatus.ACTIVE && startTime > now) {
        return { isValid: true, message: '' };
      }
      return { 
        isValid: false, 
        message: 'İptal edilmiş etkinlik sadece başlamamışsa aktifleştirilebilir.' 
      };
    }

    return { isValid: false, message: 'Geçersiz durum değişikliği.' };
  } catch (error) {
    logger.error('Durum validasyon hatası:', error);
    return { isValid: false, message: 'Durum validasyonu sırasında bir hata oluştu.' };
  }
};

export const updateEventStatus = async (
  eventId: string,
  status: EventStatus,
  userId: string
): Promise<any> => {
  try {
    logger.info(`Etkinlik durumu güncelleme: eventId=${eventId}, status=${status}, userId=${userId}`);
    
    // Status validasyonu
    const statusValidation = UpdateEventStatusSchema.safeParse({ status });
    if (!statusValidation.success) {
      throw new EventValidationError('Geçersiz etkinlik durumu.');
    }

    // Etkinliği bul
    const event = await findEventById(eventId);
    logger.info(`Etkinlik bulundu: ${JSON.stringify(event, null, 2)}`);

    // Yetki kontrolü
    const hasPermission = await canUpdateEventStatus(userId, event);
    if (!hasPermission) {
      throw new EventPermissionError('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    // Durum güncelleme validasyonu
    const { isValid, message } = await validateStatusUpdate(event, status);
    if (!isValid) {
      throw new EventStatusError(message);
    }

    // Prepare data for update, including approval/rejection timestamps
    const updateData: any = {
      status: status,
      updated_at: new Date() // Use Date object directly, Supabase handles conversion
    };

    if (status === EventStatus.ACTIVE) {
      // Check if it was PENDING before to set approved_at
      // We might need to fetch the event again or trust the validation logic implicitly set the previous state
      // Assuming the state transition PENDING -> ACTIVE implies approval
      if (event.status === EventStatus.PENDING) {
           updateData.approved_at = new Date();
           logger.info(`Setting approved_at for event ${eventId}`);
      }
    } else if (status === EventStatus.REJECTED) {
      updateData.rejected_at = new Date();
      logger.info(`Setting rejected_at for event ${eventId}`);
    }

    // Optimistic locking için version kontrolü (optional, remove if not using versioning)
    // Execute the update
    const { data, error } = await supabaseAdmin
      .from('Events')
      .update(updateData) // Use the prepared updateData object
      .eq('id', eventId)
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*)
      `)
      .single();

    if (error) {
      logger.error(`Etkinlik durumu güncelleme hatası: ${error.message}`, error);
      throw new Error('Etkinlik durumu güncellenirken bir hata oluştu.');
    }

    if (!data) {
      throw new EventStatusError('Etkinlik durumu başka bir kullanıcı tarafından değiştirilmiş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    // Etkinliğin mevcut katılımcılarını bul
    try {
      const { data: participants } = await supabaseAdmin
        .from('Event_Participants')
        .select('user_id')
        .eq('event_id', eventId);

      if (participants && participants.length > 0 && data.title) {
        // Bildirim servisleri için gerekli modülleri yükle
        const { MobileNotificationService } = require('../services/MobileNotificationService');
        const { MobileNotificationType } = require('../models/MobileNotification');
        
        const mobileNotificationService = new MobileNotificationService();
        
        // Bildirim başlığı ve içeriğini hazırla
        let title, body, notificationType;
        
        switch (status) {
          case EventStatus.ACTIVE:
            title = 'Etkinlik Durumu: Aktif';
            body = `"${data.title}" etkinliği aktif duruma geçti.`;
            notificationType = MobileNotificationType.EVENT_STATUS_CHANGE;
            break;
          case EventStatus.CANCELLED:
            title = 'Etkinlik İptal Edildi';
            body = `"${data.title}" etkinliği iptal edildi.`;
            notificationType = MobileNotificationType.EVENT_CANCELLED;
            break;
          case EventStatus.COMPLETED:
            title = 'Etkinlik Tamamlandı';
            body = `"${data.title}" etkinliği tamamlandı.`;
            notificationType = MobileNotificationType.EVENT_COMPLETED;
            break;
          case EventStatus.REJECTED:
            title = 'Etkinlik Reddedildi';
            body = `"${data.title}" etkinliği yönetici tarafından reddedildi.`;
            notificationType = MobileNotificationType.EVENT_STATUS_CHANGE;
            break;
          default:
            title = 'Etkinlik Durumu Değişti';
            body = `"${data.title}" etkinliğinin durumu değişti.`;
            notificationType = MobileNotificationType.EVENT_STATUS_CHANGE;
        }
        
        logger.info(`Etkinlik durum değişikliği bildirimi gönderiliyor: ${status} - ${participants.length} katılımcıya`);
        
        // Tüm katılımcılara bildirim gönder
        for (const participant of participants) {
          // Etkinlik sahibine zaten bildirim gönderiliyor, tekrar göndermeye gerek yok
          if (participant.user_id === event.creator_id) continue;
          
          await mobileNotificationService.createNotification({
            user_id: participant.user_id,
            title,
            body,
            data: {
              type: 'EVENT_STATUS_CHANGED',
              eventId: eventId,
              eventTitle: data.title,
              previousStatus: event.status,
              newStatus: status,
              deepLink: `sportlink://events/${eventId}`
            },
            notification_type: notificationType,
            device_token: null,
            platform: null
          });
        }
        
        logger.info(`Etkinlik durum değişikliği bildirimleri başarıyla gönderildi: eventId=${eventId}`);
      }
    } catch (notificationError) {
      // Bildirim gönderme hatası ana işlemi etkilemesin
      logger.error('Etkinlik durum değişikliği bildirimi gönderme hatası:', notificationError);
    }

    logger.info(`Etkinlik durumu başarıyla güncellendi: ${eventId} -> ${status}`);
    return formatEvent(data);
  } catch (error) {
    if (error instanceof EventNotFoundError || 
        error instanceof EventPermissionError || 
        error instanceof EventStatusError ||
        error instanceof EventValidationError) {
      throw error;
    }
    logger.error('Update event status error:', error);
    throw error;
  }
};

export const markExpiredEventsAsCompleted = async (): Promise<void> => {
  try {
    const now = new Date();
    logger.info(`Süresi dolmuş etkinlikleri tamamlandı olarak işaretleme işlemi başlatıldı. Şu anki zaman: ${now.toISOString()}`);
    
    const { error } = await supabaseAdmin
      .from('Events')
      .update({ 
        status: EventStatus.COMPLETED,
        updated_at: now.toISOString()
      })
      .eq('status', EventStatus.ACTIVE)
      .lt('end_time', now.toISOString());

    if (error) {
      logger.error('Süresi dolmuş etkinlikleri işaretleme hatası:', error);
      throw new Error('Süresi dolmuş etkinlikler tamamlandı olarak işaretlenirken bir hata oluştu.');
    }
    
    logger.info('Süresi dolmuş etkinlikler başarıyla tamamlandı olarak işaretlendi');
  } catch (error) {
    logger.error('Süresi dolmuş etkinlikleri işaretleme hatası:', error);
    throw error;
  }
};

export const createEvent = async (eventData: any) => {
  try {
    logger.info(`Etkinlik oluşturma başlatıldı: ${JSON.stringify(eventData, null, 2)}`);
    
    // Veri validasyonu yapabiliriz
    if (!eventData.title) {
      throw new EventValidationError('Etkinlik başlığı gereklidir');
    }
    
    if (!eventData.sport_id) {
      throw new EventValidationError('Spor türü gereklidir');
    }
    
    if (!eventData.event_date || !eventData.start_time || !eventData.end_time) {
      throw new EventValidationError('Etkinlik tarih ve saatleri gereklidir');
    }
    
    if (!eventData.location_name) {
      throw new EventValidationError('Etkinlik konumu gereklidir');
    }
    
    if (!eventData.creator_id) {
      throw new EventValidationError('Oluşturucu ID\'si gereklidir');
    }
    
    // UUID kontrolü
    try {
      logger.info(`Creator ID formatı kontrolü: ${eventData.creator_id}, tip: ${typeof eventData.creator_id}`);
      
      // Temel UUID formatı kontrolü (Standart UUID formatı: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegexTest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventData.creator_id);
      logger.info(`UUID regex kontrolü: ${uuidRegexTest ? 'Geçerli format' : 'Geçersiz format'}`);
      
      // Kullanıcı varlık kontrolü
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', eventData.creator_id)
        .single();
        
      if (userError) {
        logger.error(`Creator ID veritabanı kontrolü hatası: ${JSON.stringify(userError, null, 2)}`);
      }
      
      if (!userData) {
        logger.warn(`Uyarı: ${eventData.creator_id} ID'li kullanıcı veritabanında bulunamadı`);
      } else {
        logger.info(`Kullanıcı veritabanında doğrulandı: ${userData.id}, Rolü: ${userData.role}`);
      }
    } catch (uuidError) {
      logger.error(`UUID kontrolü sırasında hata: ${uuidError instanceof Error ? uuidError.message : 'Bilinmeyen hata'}`);
    }
    
    // Supabase'e gönderilecek veriyi hazırla
    const eventDataToInsert = {
      title: eventData.title,
      description: eventData.description || '',
      creator_id: eventData.creator_id,
      sport_id: typeof eventData.sport_id === 'string' && !isNaN(Number(eventData.sport_id)) 
        ? Number(eventData.sport_id) 
        : eventData.sport_id,
      event_date: eventData.event_date,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location_name: eventData.location_name,
      location_latitude: parseFloat(eventData.location_lat || eventData.location_latitude || 0),
      location_longitude: parseFloat(eventData.location_long || eventData.location_longitude || 0),
      max_participants: Number(eventData.max_participants),
      status: EventStatus.PENDING,  // Tüm kullanıcılar için PENDING durumunda başlat
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    logger.info(`Supabase insert hazırlandı: ${JSON.stringify(eventDataToInsert, null, 2)}`);

    // Etkinliği oluştur
    const { data, error } = await supabaseAdmin
      .from('Events')
      .insert([eventDataToInsert])
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*),
        creator:users!Events_creator_id_fkey(
          id,
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants(count)
      `)
      .single();

    if (error) {
      logger.error(`Supabase insert hatası: ${error.message}`, { error: JSON.stringify(error, null, 2) });
      
      // Genel hata kodları kontrolü
      if (error.code) {
        logger.error(`PostgreSQL hata kodu: ${error.code}`, { 
          code: error.code,
          details: error.details || 'Detay yok',
          message: error.message || 'Mesaj yok',
          hint: error.hint || 'İpucu yok'
        });
      }
      
      if (error.code === '23503') {
        logger.error(`Foreign key violation hatası: ${error.details || 'Detay bulunmuyor'}`);
        throw new Error(`Geçersiz ilişki hatası: ${error.message}`);
      }
      
      if (error.code === '22P02') {
        logger.error(`Veri tipi hatası: ${error.details || 'Detay bulunmuyor'}`);
        throw new Error(`Geçersiz veri türü: ${error.message}`);
      }
      
      if (error.code === '23505') {
        logger.error(`Unique violation hatası: ${error.details || 'Detay bulunmuyor'}`);
        throw new Error(`Bu etkinlik zaten var: ${error.message}`);
      }
      
      if (error.code === '42501') {
        logger.error(`İzin hatası - RLS kuralları engel olmuş olabilir`);
        throw new Error(`Erişim izni hatası: ${error.message}`);
      }
      
      throw new Error(`Etkinlik oluşturulamadı: ${error.message}`);
    }

    if (!data) {
      logger.error('Etkinlik verisi bulunamadı, ancak hata da döndürülmedi');
      throw new Error('Etkinlik oluşturuldu ancak veri döndürülemedi');
    }

    logger.info(`Etkinlik başarıyla oluşturuldu: ${data.id}`, { data: JSON.stringify(data, null, 2) });
    return formatEvent(data);
  } catch (error) {
    logger.error(`createEvent service hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    logger.error(`Hata stack: ${error instanceof Error ? error.stack : 'Stack yok'}`);
    throw error;
  }
};

export const getAllEvents = async (userId: string) => {
  try {
    logger.info(`Tüm etkinlikler getiriliyor (Kullanıcı: ${userId})`);
    
    // Kullanıcının rolünü kontrol et
    const isAdmin = await isUserAdmin(userId);
    logger.info(`Kullanıcı rolü: ${isAdmin ? 'ADMIN' : 'USER'}`);
    
    // Önce kullanıcıların etkinlikleri görmesine izin verildiğinden emin ol
    // Tüm kullanıcılar, admin olsun veya olmasın bu endpointe erişilebilmeli
    
    // Supabase sorgusu, RLS politikalarını dikkate alır
    const { data, error } = await supabaseAdmin
      .from('Events')
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*),
        creator:users!Events_creator_id_fkey(
          id,
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants(count)
      `)
      .order('event_date', { ascending: true });
    
    if (error) {
      logger.error(`Etkinlikleri getirme hatası: ${error.message}`, { 
        error: JSON.stringify(error, null, 2),
        code: error.code,
        details: error.details || 'Detay yok',
        hint: error.hint || 'İpucu yok'
      });
      throw new Error('Etkinlikler getirilemedi');
    }
    
    logger.info(`${data.length} etkinlik bulundu`);
    return data.map(event => formatEvent(event));
  } catch (error) {
    logger.error('getAllEvents hatası:', error);
    throw error;
  }
};

/**
 * Bugünün etkinliklerini getiren fonksiyon
 * @param userId Kullanıcı ID'si (opsiyonel)
 * @param page Sayfa numarası (varsayılan: 1)
 * @param limit Sayfa başına kayıt sayısı (varsayılan: 10)
 * @returns Sayfalanmış bugünkü etkinlik listesi
 */
export const getTodayEvents = async (
  userId?: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  events: any[];
  totalEvents: number;
  totalPages: number;
}> => {
  try {
    // Bugünün başlangıç ve bitiş zamanlarını al
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Sayfalama için offset hesapla
    const offset = (page - 1) * limit;
    
    logger.info('Bugünün etkinlikleri alınıyor', {
      startOfToday: startOfToday.toISOString(),
      endOfToday: endOfToday.toISOString(),
      page,
      limit,
      offset
    });

    // Önce toplam etkinlik sayısını öğrenmek için count sorgusu yap
    const { count, error: countError } = await supabaseAdmin
      .from('Events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', startOfToday.toISOString())
      .lte('event_date', endOfToday.toISOString())
      .eq('status', EventStatus.ACTIVE);
      
    if (countError) {
      logger.error('Bugünün etkinlik sayısı alınırken hata oluştu:', countError);
      throw new Error('Bugünün etkinlikleri sayılırken bir hata oluştu.');
    }
    
    const totalEvents = count || 0;
    const totalPages = Math.ceil(totalEvents / limit);
    
    logger.info(`Bugün için toplam ${totalEvents} etkinlik bulundu, ${totalPages} sayfa`);

    // Bugünün etkinliklerini getir - tüm ilişkileri spesifik olarak belirt
    const { data: events, error } = await supabaseAdmin
      .from('Events')
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*),
        creator:users!Events_creator_id_fkey(
          id,
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants(count)
      `)
      .gte('event_date', startOfToday.toISOString())
      .lte('event_date', endOfToday.toISOString())
      .eq('status', EventStatus.ACTIVE)
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      logger.error('Bugünün etkinlikleri alınırken hata oluştu:', error);
      throw new Error('Bugünün etkinlikleri alınırken bir hata oluştu.');
    }

    // Verileri frontend formatına dönüştür
    if (!events) return { events: [], totalEvents: 0, totalPages: 0 };
    
    // Standart formatta tüm etkinlikleri döndür
    const formattedEvents = events.map(event => formatEvent(event));
    
    return {
      events: formattedEvents,
      totalEvents,
      totalPages
    };
  } catch (error) {
    logger.error('Bugünün etkinlikleri alınırken beklenmeyen bir hata oluştu:', error);
    throw new Error('Bugünün etkinlikleri alınırken bir hata oluştu.');
  }
};

/**
 * Etkinlik bilgilerini günceller
 * @param eventId Güncellenecek etkinliğin ID'si
 * @param eventData Güncellenecek veriler
 * @param userId İşlemi yapan kullanıcının ID'si
 * @returns Güncellenmiş etkinlik verisi
 */
export const updateEvent = async (
  eventId: string,
  eventData: any,
  userId: string
): Promise<any> => {
  try {
    logger.info(`Etkinlik güncelleme: eventId=${eventId}, userId=${userId}`, {
      eventData: JSON.stringify(eventData, null, 2)
    });
    
    // Etkinliği bul
    const existingEvent = await findEventById(eventId);
    logger.info(`Mevcut etkinlik bulundu: ${JSON.stringify(existingEvent, null, 2)}`);

    // Yetki kontrolü
    const hasPermission = await canUpdateEventStatus(userId, existingEvent);
    if (!hasPermission) {
      throw new EventPermissionError('Bu etkinliği güncelleme yetkiniz bulunmamaktadır.');
    }
    
    // Tamamlanmış etkinlikler güncellenemez
    if (existingEvent.status === EventStatus.COMPLETED) {
      throw new EventStatusError('Tamamlanmış etkinlikler güncellenemez.');
    }
    
    // Validasyon kontrolü: Başlangıç/bitiş zamanları
    if (
      (eventData.start_time && eventData.end_time) || 
      (eventData.start_time && existingEvent.end_time) ||
      (existingEvent.start_time && eventData.end_time)
    ) {
      const startTime = new Date(eventData.start_time || existingEvent.start_time);
      const endTime = new Date(eventData.end_time || existingEvent.end_time);
      
      if (endTime <= startTime) {
        throw new EventValidationError('Bitiş zamanı başlangıç zamanından sonra olmalıdır.');
      }
    }
    
    // Güncelleme verilerini hazırla, sadece gönderilen alanları güncelle
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Güncellenebilecek alanlar
    const updatableFields = [
      'title', 'description', 'sport_id', 'event_date', 
      'start_time', 'end_time', 'location_name', 
      'location_latitude', 'location_longitude', 'max_participants'
    ];
    
    // Gönderilen alanları updateData'ya ekle
    updatableFields.forEach(field => {
      if (eventData[field] !== undefined) {
        // Field adı farklı olan özel durumlar
        if (field === 'location_latitude' && eventData.location_lat !== undefined) {
          updateData[field] = parseFloat(eventData.location_lat);
        } 
        else if (field === 'location_longitude' && eventData.location_long !== undefined) {
          updateData[field] = parseFloat(eventData.location_long);
        }
        // Standart alanlar
        else if (eventData[field] !== undefined) {
          // Sayısal değerler için dönüşüm
          if (field === 'sport_id' && typeof eventData[field] === 'string' && !isNaN(Number(eventData[field]))) {
            updateData[field] = Number(eventData[field]);
          } 
          else if (field === 'max_participants') {
            updateData[field] = Number(eventData[field]);
          }
          // Konum değerleri için dönüşüm
          else if (field === 'location_latitude' || field === 'location_longitude') {
            updateData[field] = parseFloat(eventData[field]);
          }
          // Diğer tüm alanlar
          else {
            updateData[field] = eventData[field];
          }
        }
      }
    });
    
    logger.info(`Güncelleme verisi hazırlandı: ${JSON.stringify(updateData, null, 2)}`);
    
    // Güncelleme için boş veri kontrolü
    if (Object.keys(updateData).length <= 1) { // Sadece updated_at varsa
      throw new EventValidationError('Güncellenecek veri bulunamadı.');
    }
    
    // Veritabanında güncelleme işlemi
    const { data, error } = await supabaseAdmin
      .from('Events')
      .update(updateData)
      .eq('id', eventId)
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*)
      `)
      .single();

    if (error) {
      logger.error(`Etkinlik güncelleme hatası: ${error.message}`, error);
      
      // Özel hata kontrolleri
      if (error.code === '23503') {
        throw new Error('Geçersiz ilişki hatası. Spor ID geçerli değil.');
      }
      
      throw new Error('Etkinlik güncellenirken bir hata oluştu.');
    }

    if (!data) {
      throw new EventStatusError('Etkinlik başka bir kullanıcı tarafından değiştirilmiş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    // Etkinlik güncellendiğinde katılımcılara bildirim gönder
    try {
      // Etkinliğin katılımcılarını bul
      const { data: participants } = await supabaseAdmin
        .from('Event_Participants')
        .select('user_id')
        .eq('event_id', eventId);

      if (participants && participants.length > 0) {
        const { MobileNotificationService } = require('../services/MobileNotificationService');
        const { MobileNotificationType } = require('../models/MobileNotification');
        
        const mobileNotificationService = new MobileNotificationService();
        
        // Hangi alanların güncellendiğini bul
        const updatedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
        
        // Bildirim metni oluştur
        let title = 'Etkinlik Güncellendi';
        let body = `"${data.title}" etkinliğinde güncellemeler yapıldı`;
        
        // Tarih veya saat değişikliği varsa bunu belirt
        if (updatedFields.includes('event_date') || updatedFields.includes('start_time') || updatedFields.includes('end_time')) {
          body = `"${data.title}" etkinliğinin tarih/saat bilgileri güncellendi`;
        } 
        // Konum değişikliği varsa bunu belirt
        else if (updatedFields.includes('location_name') || updatedFields.includes('location_latitude') || updatedFields.includes('location_longitude')) {
          body = `"${data.title}" etkinliğinin konum bilgileri güncellendi`;
        }
        
        logger.info(`Etkinlik güncelleme bildirimi gönderiliyor: ${participants.length} katılımcıya`);
        
        // Tüm katılımcılara bildirim gönder (etkinlik sahibi dahil değil)
        for (const participant of participants) {
          // Güncelleyen kişi kendiyse ona bildirim gönderme
          if (participant.user_id === userId) continue;
          
          await mobileNotificationService.createNotification({
            user_id: participant.user_id,
            title,
            body,
            data: {
              type: 'EVENT_UPDATED',
              eventId: eventId,
              eventTitle: data.title,
              updatedFields: updatedFields,
              deepLink: `sportlink://events/${eventId}`
            },
            notification_type: MobileNotificationType.EVENT_UPDATE,
            device_token: null,
            platform: null
          });
        }
        
        logger.info(`Etkinlik güncelleme bildirimleri başarıyla gönderildi: eventId=${eventId}`);
      }
    } catch (notificationError) {
      // Bildirim gönderme hatası ana işlemi etkilemesin
      logger.error('Etkinlik güncelleme bildirimi gönderme hatası:', notificationError);
    }

    logger.info(`Etkinlik başarıyla güncellendi: ${eventId}`);
    return formatEvent(data);
  } catch (error) {
    logger.error(`updateEvent hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, {
      stack: error instanceof Error ? error.stack : 'Stack yok'
    });
    throw error;
  }
};

/**
 * Etkinliği siler
 * @param eventId Silinecek etkinliğin ID'si
 * @param userId İşlemi yapan kullanıcının ID'si
 * @returns Başarı mesajı
 */
export const deleteEvent = async (
  eventId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    logger.info(`Etkinlik silme: eventId=${eventId}, userId=${userId}`);
    
    // Etkinliği bul
    const existingEvent = await findEventById(eventId);
    logger.info(`Silinecek etkinlik bulundu: ${existingEvent.id}`);

    // Yetki kontrolü - sadece etkinlik sahibi veya ADMIN silebilir
    const isAdmin = await isUserAdmin(userId);
    
    if (!isAdmin && existingEvent.creator_id !== userId) {
      logger.warn(`Yetki hatası: Kullanıcı (${userId}) kendi oluşturmadığı (${existingEvent.creator_id}) etkinliği silmeye çalışıyor`);
      throw new EventPermissionError('Bu etkinliği silme yetkiniz bulunmamaktadır. Sadece kendi oluşturduğunuz etkinlikleri silebilirsiniz.');
    }
    
    // Önce etkinlikle ilgili bildirimleri sil
    try {
      const { error: notificationsError } = await supabaseAdmin
        .from('Notifications')
        .delete()
        .eq('event_id', eventId);
      
      if (notificationsError) {
        logger.warn(`Etkinlik bildirimlerini silme hatası: ${notificationsError.message}`);
      }
    } catch (notificationsError) {
      logger.warn(`Etkinlik bildirimlerini silme hatası: ${notificationsError instanceof Error ? notificationsError.message : 'Bilinmeyen hata'}`);
    }
    
    // Etkinlikten önce etkinlik katılımcılarını sil (foreign key constraints)
    const { error: participantsError } = await supabaseAdmin
      .from('Event_Participants')
      .delete()
      .eq('event_id', eventId);
    
    if (participantsError) {
      logger.error(`Etkinlik katılımcılarını silme hatası: ${participantsError.message}`);
      throw new Error('Etkinlik katılımcıları silinirken bir hata oluştu.');
    }
    
    // Etkinliğe yapılmış raporları sil (eğer varsa)
    try {
      const { error: reportsError } = await supabaseAdmin
        .from('Reports')
        .delete()
        .eq('event_id', eventId);  // 'related_event' yerine 'event_id' kullanıyoruz
      
      if (reportsError) {
        logger.warn(`Etkinlik raporlarını silme hatası: ${reportsError.message}`);
      }
    } catch (reportsError) {
      logger.warn(`Etkinlik raporlarını silme hatası: ${reportsError instanceof Error ? reportsError.message : 'Bilinmeyen hata'}`);
    }
    
    // Etkinliği sil
    const { error: deleteError } = await supabaseAdmin
      .from('Events')
      .delete()
      .eq('id', eventId);
    
    if (deleteError) {
      logger.error(`Etkinlik silme hatası: ${deleteError.message}`);
      throw new Error('Etkinlik silinirken bir hata oluştu.');
    }
    
    logger.info(`Etkinlik başarıyla silindi: ${eventId}`);
    return {
      success: true,
      message: 'Etkinlik başarıyla silindi.'
    };
  } catch (error) {
    logger.error(`deleteEvent hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, {
      stack: error instanceof Error ? error.stack : 'Stack yok'
    });
    throw error;
  }
};

export const getEventDetails = async (eventId: string) => {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('Events')
      .select(`
        *,
        creator:users!creator_id (
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants (count)
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      logger.error('Etkinlik detayları alınırken hata:', error);
      throw error;
    }

    // Katılımcı sayısını ve doluluk durumunu kontrol et
    const currentParticipants = event.participants[0].count;
    const isFull = currentParticipants >= event.max_participants;

    return {
      ...event,
      creator_name: `${event.creator.first_name} ${event.creator.last_name}`,
      creator_role: event.creator.role,
      current_participants: currentParticipants,
      is_full: isFull
    };
  } catch (error) {
    logger.error('Etkinlik detayları alınırken hata:', error);
    throw error;
  }
};

export const joinEvent = async (eventId: string, userId: string, role: string = 'PARTICIPANT') => {
  try {
    logger.info(`Kullanıcı etkinliğe katılıyor: eventId=${eventId}, userId=${userId}, role=${role}`);
    
    // Önce etkinlik detaylarını ve katılımcı sayısını kontrol et
    const { data: event, error: eventError } = await supabaseAdmin
      .from('Events')
      .select(`
        id,
        status,
        max_participants,
        participants:Event_Participants (count),
        creator_id,
        title
      `)
      .eq('id', eventId)
      .single();

    if (eventError) {
      logger.error('Etkinlik bilgileri alınırken hata:', eventError);
      throw new Error('Etkinlik bulunamadı');
    }
    
    // Etkinlik durumunu kontrol et
    if (event.status !== EventStatus.ACTIVE) {
      logger.warn(`Etkinlik aktif değil: eventId=${eventId}, status=${event.status}`);
      throw new Error(`Bu etkinliğe katılamazsınız. Etkinlik durumu: ${event.status}`);
    }
    
    // Kullanıcı kendi etkinliğine katılmak istiyorsa engelle
    if (event.creator_id === userId) {
      logger.warn(`Kullanıcı kendi etkinliğine katılmaya çalışıyor: eventId=${eventId}, userId=${userId}`);
      throw new Error('Kendi oluşturduğunuz etkinliğe katılımcı olarak katılamazsınız');
    }
    
    // Kullanıcı zaten etkinliğe katılmış mı kontrol et
    const { data: existingParticipation, error: participationError } = await supabaseAdmin
      .from('Event_Participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (participationError) {
      logger.error('Katılım kontrolü sırasında hata:', participationError);
      throw new Error('Katılım durumu kontrol edilirken bir hata oluştu');
    }
    
    if (existingParticipation) {
      logger.warn(`Kullanıcı zaten etkinliğe katılmış: eventId=${eventId}, userId=${userId}`);
      throw new Error('Bu etkinliğe zaten katıldınız');
    }

    // Katılımcı sayısını kontrol et
    const currentParticipants = event.participants[0]?.count || 0;
    if (currentParticipants >= event.max_participants) {
      logger.warn(`Etkinlik dolu: eventId=${eventId}, maxParticipants=${event.max_participants}, currentParticipants=${currentParticipants}`);
      throw new Error('Bu etkinlik maksimum katılımcı sayısına ulaştı');
    }

    // Katılımcı ekle
    const { error: participantError } = await supabaseAdmin
      .from('Event_Participants')
      .insert({
        event_id: eventId,
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      });

    if (participantError) {
      logger.error('Etkinliğe katılım eklenirken hata:', participantError);
      throw new Error('Etkinliğe katılım sağlanırken bir hata oluştu');
    }

    // Katılan kullanıcı bilgilerini al
    try {
      const { data: userInfo } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, profile_picture')
        .eq('id', userId)
        .single();

      // Etkinlik sahibine bildirim gönder
      if (userInfo && event.creator_id) {
        const { MobileNotificationService } = require('../services/MobileNotificationService');
        const { MobileNotificationType } = require('../models/MobileNotification');
        
        const mobileNotificationService = new MobileNotificationService();
        
        logger.info(`Etkinlik katılım bildirimi gönderiliyor: eventId=${eventId}, creator=${event.creator_id}, participant=${userId}`);
        
        const title = 'Etkinliğinize Yeni Katılım';
        const body = `${userInfo.first_name} ${userInfo.last_name} "${event.title}" etkinliğinize katıldı`;
        
        await mobileNotificationService.createNotification({
          user_id: event.creator_id,
          title,
          body,
          data: {
            type: 'EVENT_PARTICIPANT_JOINED',
            eventId: eventId,
            eventTitle: event.title,
            participantId: userId,
            participantName: `${userInfo.first_name} ${userInfo.last_name}`,
            participantProfilePicture: userInfo.profile_picture,
            deepLink: `sportlink://events/${eventId}`
          },
          notification_type: MobileNotificationType.EVENT_JOIN,
          device_token: null,
          platform: null
        });
        
        logger.info(`Etkinlik katılım bildirimi başarıyla gönderildi: eventId=${eventId}`);
      }
    } catch (error) {
      // Bildirim gönderme hatası ana işlemi etkilemesin
      logger.error('Etkinlik katılım bildirimi gönderme hatası:', error);
    }

    logger.info(`Etkinliğe katılım başarılı: eventId=${eventId}, userId=${userId}, role=${role}`);
    return { success: true, message: 'Etkinliğe başarıyla katıldınız' };
  } catch (error) {
    logger.error('Etkinliğe katılım sırasında hata:', error);
    throw error;
  }
};

/**
 * Kullanıcının katıldığı tüm etkinlikleri getirir
 * @param userId Kullanıcı ID'si
 * @param page Sayfa numarası (1'den başlar)
 * @param limit Sayfa başına gösterilecek etkinlik sayısı
 * @returns Etkinlikler, toplam sayı ve sayfalama bilgileri
 */
export const getUserParticipatedEvents = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) => {
  try {
    logger.info(`Kullanıcının katıldığı etkinlikler alınıyor: userId=${userId}, page=${page}, limit=${limit}`);
    
    // Bypass RLS: use admin client
    let query = supabaseAdmin
      .from('Event_Participants')
      .select('event_id', { count: 'exact' })
      .eq('user_id', userId);
    
    const { count: totalCount, error: countError } = await query;
    
    if (countError) {
      logger.error('Katılınan etkinlik sayısı alınırken hata:', countError);
      throw new Error('Katılınan etkinlik sayısı alınırken bir hata oluştu');
    }
    
    // Bypass RLS: use admin client
    let eventQuery = supabaseAdmin
      .from('Event_Participants')
      .select(`
        event:Events (
          id,
          sport_id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location_name,
          location_latitude,
          location_longitude,
          max_participants,
          status,
          created_at,
          updated_at,
          creator_id,
          sport:Sports!Events_sport_id_fkey (
            id,
            name,
            icon
          ),
          creator:users!Events_creator_id_fkey (
            id,
            first_name,
            last_name,
            profile_picture
          )
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    
    // Eğer status filtresi varsa, etkinlikleri filtrele
    if (status) {
      eventQuery = eventQuery.eq('event.status', status);
    }
    
    // Sayfalama
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    eventQuery = eventQuery.range(from, to);
    
    const { data, error } = await eventQuery;
    
    if (error) {
      logger.error('Katılınan etkinlikler alınırken hata:', error);
      throw new Error('Katılınan etkinlikler alınırken bir hata oluştu');
    }
    
    // Null olmayanları filtrele ve event nesnesini al
    const events = data
      .filter(item => item.event)
      .map(item => {
        const event = item.event as any;
        return {
          ...event,
          sport: event.sport,
          creator: {
            id: event.creator?.id,
            name: `${event.creator?.first_name || ''} ${event.creator?.last_name || ''}`.trim(),
            profile_picture: event.creator?.profile_picture
          }
        };
      });
    
    return {
      events,
      meta: {
        totalCount: totalCount || 0,
        page,
        limit,
        pageCount: Math.ceil((totalCount || 0) / limit)
      }
    };
    
  } catch (error) {
    logger.error('Kullanıcının katıldığı etkinlikler alınırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcının oluşturduğu tüm etkinlikleri getirir
 * @param userId Kullanıcı ID'si
 * @param page Sayfa numarası (1'den başlar)
 * @param limit Sayfa başına gösterilecek etkinlik sayısı
 * @returns Etkinlikler, toplam sayı ve sayfalama bilgileri
 */
export const getUserCreatedEvents = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) => {
  try {
    logger.info(`Kullanıcının oluşturduğu etkinlikler alınıyor: userId=${userId}, page=${page}, limit=${limit}`);
    
    // Bypass RLS: use admin client
    let countQuery = supabaseAdmin
      .from('Events')
      .select('id', { count: 'exact' })
      .eq('creator_id', userId);
      
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      logger.error('Oluşturulan etkinlik sayısı alınırken hata:', countError);
      throw new Error('Oluşturulan etkinlik sayısı alınırken bir hata oluştu');
    }
    
    // Bypass RLS: use admin client
    let query = supabaseAdmin
      .from('Events')
      .select(`
        id,
        sport_id,
        title,
        description,
        event_date,
        start_time,
        end_time,
        location_name,
        location_latitude,
        location_longitude,
        max_participants,
        status,
        created_at,
        updated_at,
        sport:Sports!Events_sport_id_fkey (
          id,
          name,
          icon
        )
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    
    // Eğer status filtresi varsa, etkinlikleri filtrele
    if (status) {
      query = query.eq('status', status);
    }
    
    // Sayfalama
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Oluşturulan etkinlikler alınırken hata:', error);
      throw new Error('Oluşturulan etkinlikler alınırken bir hata oluştu');
    }
    
    // Her etkinlik için katılımcı sayısını getir
    const eventsWithParticipantCounts = await Promise.all(
      data.map(async (event) => {
        const { count: participantCount, error: participantError } = await supabase
          .from('Event_Participants')
          .select('event_id', { count: 'exact' })
          .eq('event_id', event.id);
          
        if (participantError) {
          logger.warn(`Etkinlik katılımcı sayısı alınamadı, id=${event.id}:`, participantError);
        }
        
        return {
          ...event,
          sport: event.sport,
          participant_count: participantCount || 0
        };
      })
    );
    
    return {
      events: eventsWithParticipantCounts,
      meta: {
        totalCount: totalCount || 0,
        page,
        limit,
        pageCount: Math.ceil((totalCount || 0) / limit)
      }
    };
    
  } catch (error) {
    logger.error('Kullanıcının oluşturduğu etkinlikler alınırken hata:', error);
    throw error;
  }
};

/**
 * Başlangıç zamanına 30 dakika veya daha az kalmış ve hala PENDING durumunda olan etkinlikleri 
 * otomatik olarak REJECTED durumuna geçirir.
 */
export const autoRejectPendingEvents = async (): Promise<void> => {
  try {
    const now = new Date();
    // Şimdiden 30 dakika sonrasını hesapla
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    logger.info(`Başlangıç zamanına 30 dakika kalan PENDING etkinlikleri otomatik reddetme işlemi başlatıldı. Şu anki zaman: ${now.toISOString()}`);
    logger.info(`Kontrol edilen zaman aralığı: ${now.toISOString()} - ${thirtyMinutesFromNow.toISOString()}`);
    
    // PENDING durumunda olan ve başlangıç zamanı şimdiden 30 dakika içinde olan etkinlikleri bul
    const { data, error } = await supabaseAdmin
      .from('Events')
      .select('id, title, start_time')
      .eq('status', EventStatus.PENDING)
      .gte('start_time', now.toISOString()) // Şimdi veya daha sonra başlayacak
      .lt('start_time', thirtyMinutesFromNow.toISOString()); // 30 dakika içinde başlayacak
    
    if (error) {
      logger.error('Otomatik reddedilecek etkinlikleri bulma hatası:', error);
      throw new Error('Otomatik reddedilecek etkinlikler bulunurken bir hata oluştu.');
    }
    
    if (!data || data.length === 0) {
      logger.info('Otomatik reddedilecek etkinlik bulunamadı.');
      return;
    }
    
    logger.info(`${data.length} adet etkinlik otomatik olarak reddedilecek:`, 
      data.map(e => ({ id: e.id, title: e.title, start_time: e.start_time })));
    
    // Bu etkinlikleri REJECTED olarak işaretle
    const { error: updateError } = await supabaseAdmin
      .from('Events')
      .update({ 
        status: EventStatus.REJECTED,
        updated_at: now.toISOString(),
        rejected_at: now.toISOString(),
      })
      .in('id', data.map(e => e.id));
    
    if (updateError) {
      logger.error('Etkinlikleri otomatik reddetme hatası:', updateError);
      throw new Error('Etkinlikler otomatik olarak reddedilirken bir hata oluştu.');
    }
    
    logger.info(`${data.length} adet etkinlik başarıyla otomatik olarak reddedildi.`);
  } catch (error) {
    logger.error('Etkinlikleri otomatik reddetme işlemi sırasında beklenmeyen hata:', error);
    throw error;
  }
};

/**
 * Farklı durumlardaki etkinliklerin sayılarını getiren fonksiyon
 * @param userId Opsiyonel. Belirli bir kullanıcının etkinliklerini saymak için
 * @returns Farklı durumlardaki etkinlik sayıları
 */
export const getEventCounts = async (userId?: string): Promise<{
  pending: number;
  today: number;
  upcoming: number; // Bu aslında tüm aktif etkinlikleri temsil ediyor
  rejected: number;
  completed: number;
  total: number;
}> => {
  try {
    logger.info('Etkinlik sayıları getiriliyor');
    
    // Sorgu temelini oluşturan yardımcı fonksiyon
    const createBaseQuery = () => {
      let query = supabaseAdmin.from('Events').select('*', { count: 'exact' });
      
      // Kullanıcı ID'si belirtilmişse sorguya ekle
      if (userId) {
        query = query.eq('creator_id', userId);
      }
      
      return query;
    };
    
    // Bugünün başlangıç ve bitiş zamanlarını al
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // 1. Onay bekleyen etkinlikler (PENDING)
    const { count: pending, error: pendingError } = await createBaseQuery()
      .eq('status', EventStatus.PENDING);
    
    if (pendingError) {
      logger.error('Onay bekleyen etkinlik sayısı alınamadı:', pendingError);
      throw new Error('Onay bekleyen etkinlik sayısı alınamadı');
    }
    
    // 2. Bugünkü aktif etkinlikler
    const { count: todayCount, error: todayError } = await createBaseQuery()
      .eq('status', EventStatus.ACTIVE)
      .gte('event_date', startOfToday.toISOString())
      .lte('event_date', endOfToday.toISOString());
    
    if (todayError) {
      logger.error('Bugünkü etkinlik sayısı alınamadı:', todayError);
      throw new Error('Bugünkü etkinlik sayısı alınamadı');
    }
    
    // 3. Tüm aktif etkinlikler (backend kısmında "upcoming" olarak etiketlenmiş)
    const { count: activeCount, error: activeError } = await createBaseQuery()
      .eq('status', EventStatus.ACTIVE);
    
    if (activeError) {
      logger.error('Aktif etkinlik sayısı alınamadı:', activeError);
      throw new Error('Aktif etkinlik sayısı alınamadı');
    }
    
    // 4. Reddedilen etkinlikler (REJECTED)
    const { count: rejectedCount, error: rejectedError } = await createBaseQuery()
      .eq('status', EventStatus.REJECTED);
    
    if (rejectedError) {
      logger.error('Reddedilen etkinlik sayısı alınamadı:', rejectedError);
      throw new Error('Reddedilen etkinlik sayısı alınamadı');
    }
    
    // 5. Tamamlanan etkinlikler (COMPLETED)
    const { count: completedCount, error: completedError } = await createBaseQuery()
      .eq('status', EventStatus.COMPLETED);
    
    if (completedError) {
      logger.error('Tamamlanan etkinlik sayısı alınamadı:', completedError);
      throw new Error('Tamamlanan etkinlik sayısı alınamadı');
    }
    
    // 6. Toplam etkinlik sayısı
    const { count: totalCount, error: totalError } = await createBaseQuery();
    
    if (totalError) {
      logger.error('Toplam etkinlik sayısı alınamadı:', totalError);
      throw new Error('Toplam etkinlik sayısı alınamadı');
    }
    
    return {
      pending: pending || 0,
      today: todayCount || 0,
      upcoming: activeCount || 0, // UI'da "Gelecek" olarak gösterilse de aslında tüm aktif etkinlikleri temsil ediyor
      rejected: rejectedCount || 0,
      completed: completedCount || 0,
      total: totalCount || 0
    };
  } catch (error) {
    logger.error('Etkinlik sayıları alınırken hata oluştu:', error);
    throw error;
  }
};

/**
 * Etkinliğin katılımcılarını getirir
 * @param eventId Etkinlik ID'si
 * @returns Etkinliğe katılan kullanıcıların listesi
 */
export const getEventParticipants = async (eventId: string) => {
  try {
    logger.info(`Etkinlik katılımcıları getiriliyor: eventId=${eventId}`);
    
    // Önce etkinliğin var olduğunu ve aktif olduğunu kontrol et
    const { data: event, error: eventError } = await supabaseAdmin
      .from('Events')
      .select('id, status')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      logger.error(`Etkinlik bulunamadı: ${eventError.message}`);
      throw new EventNotFoundError(eventId);
    }
    
    // Etkinlik katılımcılarını sorgusu
    const { data: participants, error } = await supabaseAdmin
      .from('Event_Participants')
      .select(`
        role,
        created_at,
        user:users (
          id,
          first_name,
          last_name,
          email,
          profile_picture,
          bio,
          role
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
      
    if (error) {
      logger.error(`Katılımcıları getirme hatası: ${error.message}`);
      throw new Error('Etkinlik katılımcıları alınırken bir hata oluştu');
    }
    
    // Katılımcı listesini formatla
    const formattedParticipants = participants.map(participant => {
      // Tip dönüşümü yapalım
      const user = participant.user as any;
      return {
        user_id: user?.id,
        full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        email: user?.email,
        profile_image: user?.profile_picture,
        bio: user?.bio,
        role: participant.role,
        user_role: user?.role,
        joined_at: participant.created_at
      };
    });
    
    logger.info(`${formattedParticipants.length} katılımcı bulundu`);
    return formattedParticipants;
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      throw error;
    }
    logger.error('Katılımcıları getirme hatası:', error);
    throw new Error('Etkinlik katılımcıları alınırken bir hata oluştu');
  }
};

/**
 * Belirli bir durumdaki etkinlikleri getiren fonksiyon
 * @param status Etkinlik durumu (pending, active, rejected, completed)
 * @param options Sayfalama ve filtreleme seçenekleri
 * @returns Etkinlikler, toplam sayı ve sayfalama bilgileri
 */
export const getEventsByStatus = async (
  status: string,
  options: {
    page?: number;
    limit?: number;
    userId?: string;
  }
): Promise<{
  events: any[];
  totalPages: number;
  totalEvents: number;
}> => {
  try {
    const { page = 1, limit = 10, userId } = options;
    
    // Durumu Enum değerine dönüştür (status lowercase gelir, ama enum UPPERCASE)
    const statusUpper = status.toUpperCase();
    logger.info(`${statusUpper} durumundaki etkinlikler alınıyor: sayfa=${page}, limit=${limit}, userId=${userId || 'tümü'}`);
    
    // Sorgu oluştur
    let query = supabaseAdmin
      .from('Events')
      .select(`
        *,
        sport:Sports!Events_sport_id_fkey(*),
        creator:users!Events_creator_id_fkey(
          id,
          first_name,
          last_name,
          role
        ),
        participants:Event_Participants(count)
      `, { count: 'exact' })
      .eq('status', statusUpper);
    
    // Eğer userId belirtilmişse, sadece o kullanıcının etkinliklerini getir
    if (userId) {
      query = query.eq('creator_id', userId);
    }
    
    // Toplam etkinlik sayısını al
    const { count: totalEvents, error: countError } = await query;
    
    if (countError) {
      logger.error(`${status} durumundaki etkinlikler sayılırken hata:`, countError);
      throw new Error(`${status} durumundaki etkinlikler sayılırken bir hata oluştu.`);
    }
    
    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil((totalEvents || 0) / limit);
    
    // Sayfalama için offset hesapla
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Belirtilen sayfadaki etkinlikleri getir
    const { data: events, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      logger.error(`${status} durumundaki etkinlikler alınırken hata:`, error);
      throw new Error(`${status} durumundaki etkinlikler alınırken bir hata oluştu.`);
    }
    
    logger.info(`${events?.length || 0} adet ${status} durumundaki etkinlik başarıyla alındı.`);
    
    // Etkinlikleri formatla ve döndür
    return {
      events: events ? events.map((event: any) => formatEvent(event)) : [],
      totalPages,
      totalEvents: totalEvents || 0
    };
  } catch (error) {
    logger.error(`${status} durumundaki etkinlikler alınırken beklenmeyen hata:`, error);
    throw error;
  }
};

/**
 * Kullanıcının etkinlikten ayrılmasını sağlayan fonksiyon
 * @param eventId Etkinlik ID'si
 * @param userId Kullanıcı ID'si
 * @returns Başarı mesajı
 */
export const leaveEvent = async (eventId: string, userId: string) => {
  try {
    logger.info(`Kullanıcı etkinlikten ayrılıyor: eventId=${eventId}, userId=${userId}`);
    
    // Önce etkinliğin varolduğunu kontrol et
    const { data: event, error: eventError } = await supabaseAdmin
      .from('Events')
      .select('id, status, creator_id, title')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      logger.error('Etkinlik bulunamadı:', eventError);
      throw new Error('Etkinlik bulunamadı');
    }
    
    // Kullanıcının bu etkinliğe katılıp katılmadığını kontrol et
    const { data: participation, error: participationError } = await supabaseAdmin
      .from('Event_Participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (participationError) {
      logger.error('Katılım durumu kontrol edilirken hata:', participationError);
      throw new Error('Katılım durumu kontrol edilirken bir hata oluştu');
    }
    
    if (!participation) {
      logger.warn(`Kullanıcı bu etkinliğe zaten katılmamış: eventId=${eventId}, userId=${userId}`);
      throw new Error('Bu etkinliğe katılmadığınız için ayrılamazsınız');
    }
    
    // Etkinlikten ayrıl
    const { error: leaveError } = await supabaseAdmin
      .from('Event_Participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
      
    if (leaveError) {
      logger.error('Etkinlikten ayrılırken hata:', leaveError);
      throw new Error('Etkinlikten ayrılırken bir hata oluştu');
    }
    
    // Ayrılan kullanıcı bilgilerini al ve etkinlik sahibine bildirim gönder
    try {
      // Kullanıcının kendi etkinliği değilse bildirim gönder
      if (event.creator_id && event.creator_id !== userId) {
        const { data: userInfo } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, profile_picture')
          .eq('id', userId)
          .single();
          
        if (userInfo) {
          const { MobileNotificationService } = require('../services/MobileNotificationService');
          const { MobileNotificationType } = require('../models/MobileNotification');
          
          const mobileNotificationService = new MobileNotificationService();
          
          logger.info(`Etkinlikten ayrılma bildirimi gönderiliyor: eventId=${eventId}, creator=${event.creator_id}, participant=${userId}`);
          
          const title = 'Etkinliğinizden Ayrılma';
          const body = `${userInfo.first_name} ${userInfo.last_name} "${event.title}" etkinliğinizden ayrıldı`;
          
          await mobileNotificationService.createNotification({
            user_id: event.creator_id,
            title,
            body,
            data: {
              type: 'EVENT_PARTICIPANT_LEFT',
              eventId: eventId,
              eventTitle: event.title,
              participantId: userId,
              participantName: `${userInfo.first_name} ${userInfo.last_name}`,
              participantProfilePicture: userInfo.profile_picture,
              deepLink: `sportlink://events/${eventId}`
            },
            notification_type: MobileNotificationType.EVENT_LEAVE,
            device_token: null,
            platform: null
          });
          
          logger.info(`Etkinlikten ayrılma bildirimi başarıyla gönderildi: eventId=${eventId}`);
        }
      }
    } catch (error) {
      // Bildirim gönderme hatası ana işlemi etkilemesin
      logger.error('Etkinlikten ayrılma bildirimi gönderme hatası:', error);
    }
    
    logger.info(`Kullanıcı başarıyla etkinlikten ayrıldı: eventId=${eventId}, userId=${userId}`);
    return { success: true, message: 'Etkinlikten başarıyla ayrıldınız' };
  } catch (error) {
    logger.error('Etkinlikten ayrılırken hata:', error);
    throw error;
  }
};

export const getNearbyEvents = async (
  latitude: number,
  longitude: number, 
  distance: number = 1
): Promise<any[]> => {
  try {
    logger.info(`Yakındaki etkinlikleri getirme: lat=${latitude}, lng=${longitude}, distance=${distance}km`);
    
    // supabase client kullanarak sorgu yap
    const { data, error } = await supabaseAdmin
      .from('Events')
      .select(`
        *,
        users!Events_creator_id_fkey(id, first_name, last_name, profile_picture), 
        Sports!Events_sport_id_fkey(id, name, icon)
      `)
      .eq('status', 'ACTIVE');

    if (error) {
      logger.error('Yakındaki etkinlikler getirilirken hata oluştu:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      logger.info('Yakında etkinlik bulunamadı');
      return [];
    }

    // Etkinlikleri filtreleyip aralarındaki mesafeyi hesaplayan JavaScript fonksiyonu
    const eventsWithDistance = data.map(event => {
      // Haversine formülü ile mesafe hesaplama
      const eventLat = event.location_latitude;
      const eventLng = event.location_longitude;
      
      if (!eventLat || !eventLng) {
        return { ...event, distance_km: Infinity };
      }
      
      // Dünya yarıçapı (km)
      const R = 6371;
      
      // Dereceyi radyana çevirme
      const lat1 = latitude * Math.PI / 180;
      const lat2 = eventLat * Math.PI / 180;
      const deltaLat = (eventLat - latitude) * Math.PI / 180;
      const deltaLng = (eventLng - longitude) * Math.PI / 180;
      
      // Haversine formülü
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) * 
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance_km = R * c;
      
      // İlişki adlarını formatladığımız için creator ve sport alanlarını da güncelliyoruz
      return {
        ...event,
        distance_km,
        creator: event.users,  // İlişki adı değiştiği için alanları da güncelliyoruz
        sport: event.Sports,  // İlişki adı değiştiği için alanları da güncelliyoruz
        participant_count: 0  // Şimdilik 0 bırakalım, izin sorunu olduğu için Event_Participants'e erişemiyoruz
      };
    })
    // Mesafe filtresi uygula
    .filter(event => event.distance_km <= distance)
    // Mesafeye göre sırala
    .sort((a, b) => a.distance_km - b.distance_km);
    
    logger.info(`${eventsWithDistance.length} yakın etkinlik bulundu (${distance}km mesafede)`);
    return eventsWithDistance;
  } catch (error) {
    logger.error('getNearbyEvents fonksiyonunda hata:', error);
    throw error;
  }
}; 

/**
 * Kullanıcıyı etkinliğe davet eder
 * @param eventId Etkinlik ID'si
 * @param inviterId Davet eden kullanıcı ID'si
 * @param inviteeId Davet edilen kullanıcı ID'si
 * @returns Başarı mesajı
 */
export const inviteUserToEvent = async (
  eventId: string,
  inviterId: string,
  inviteeId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    logger.info(`Kullanıcı etkinliğe davet ediliyor: eventId=${eventId}, inviterId=${inviterId}, inviteeId=${inviteeId}`);
    
    // Etkinliğin var olduğunu kontrol et
    const event = await findEventById(eventId);
    
    // Etkinlik aktif mi kontrol et
    if (event.status !== EventStatus.ACTIVE) {
      logger.warn(`Etkinlik aktif değil: eventId=${eventId}, status=${event.status}`);
      throw new Error(`Bu etkinliğe davet gönderemezsiniz. Etkinlik durumu: ${event.status}`);
    }
    
    // Eğer etkinlik doluysa davet gönderme
    const currentParticipants = event.current_participants || 0;
    if (currentParticipants >= event.max_participants) {
      logger.warn(`Etkinlik dolu: eventId=${eventId}`);
      throw new Error('Bu etkinlik maksimum katılımcı sayısına ulaştı, davet gönderemezsiniz');
    }
    
    // Davet edilen kullanıcı zaten etkinliğe katılmış mı kontrol et
    const { data: existingParticipation, error: participationError } = await supabaseAdmin
      .from('Event_Participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', inviteeId)
      .maybeSingle();
    
    if (participationError) {
      logger.error('Katılım kontrolü sırasında hata:', participationError);
      throw new Error('Katılım durumu kontrol edilirken bir hata oluştu');
    }
    
    if (existingParticipation) {
      logger.warn(`Kullanıcı zaten etkinliğe katılmış: eventId=${eventId}, inviteeId=${inviteeId}`);
      throw new Error('Bu kullanıcı zaten etkinliğe katılmış');
    }
    
    // Davet eden ve davet edilen kullanıcı bilgilerini al
    const [inviterData, inviteeData] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, profile_picture')
        .eq('id', inviterId)
        .single(),
      supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, profile_picture')
        .eq('id', inviteeId)
        .single()
    ]);
    
    const inviter = inviterData.data;
    const invitee = inviteeData.data;
    
    if (!inviter || !invitee) {
      logger.error('Kullanıcı bilgileri alınamadı');
      throw new Error('Kullanıcı bilgileri alınamadı');
    }
    
    // Bildirim servisleri için gerekli modülleri yükle
    const { MobileNotificationService } = require('../services/MobileNotificationService');
    const { MobileNotificationType } = require('../models/MobileNotification');
    
    const mobileNotificationService = new MobileNotificationService();
    
    // Bildirim oluştur
    const title = 'Etkinlik Daveti';
    const body = `${inviter.first_name} ${inviter.last_name} sizi "${event.title}" etkinliğine davet etti`;
    
    logger.info(`Etkinlik daveti bildirimi gönderiliyor: eventId=${eventId}, inviterId=${inviterId}, inviteeId=${inviteeId}`);
    
    await mobileNotificationService.createNotification({
      user_id: inviteeId,
      title,
      body,
      data: {
        type: 'EVENT_INVITATION',
        eventId: eventId,
        eventTitle: event.title,
        inviterId: inviterId,
        inviterName: `${inviter.first_name} ${inviter.last_name}`,
        inviterProfilePicture: inviter.profile_picture,
        deepLink: `sportlink://events/${eventId}`
      },
      notification_type: MobileNotificationType.EVENT_REMINDER,
      device_token: null,
      platform: null
    });
    
    logger.info(`Etkinlik daveti bildirimi başarıyla gönderildi: eventId=${eventId}, inviteeId=${inviteeId}`);
    
    return { 
      success: true, 
      message: `${invitee.first_name} ${invitee.last_name} etkinliğe başarıyla davet edildi`
    };
  } catch (error) {
    logger.error('Etkinliğe davet gönderilirken hata:', error);
    throw error;
  }
};