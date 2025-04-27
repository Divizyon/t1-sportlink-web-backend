import { Event, EventStatus, EventValidationSchema, UpdateEventStatusSchema, EventValidationError, EventNotFoundError, EventPermissionError, EventStatusError, TodayEvent } from '../models/Event';
import supabase, { supabaseAdmin } from '../config/supabase';
import { parseISO, addHours, isBefore, isAfter, startOfDay, endOfDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import logger from '../utils/logger';

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
    const { data, error } = await supabase
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

    // Admin olmayan kullanıcılar için kısıtlamalar
    // 1. Sadece kendi etkinliklerini güncelleyebilirler
    if (userId !== event.creator_id) {
      return false;
    }

    // 2. PENDING durumundaki etkinlikleri değiştiremezler (admin onayı gerekli)
    if (event.status === EventStatus.PENDING) {
      return false;
    }

    // 3. REJECTED durumundaki etkinlikleri değiştiremezler
    if (event.status === EventStatus.REJECTED) {
      return false;
    }

    // Diğer durumlar için etkinlik sahibi değişiklik yapabilir
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
        logger.info(`Kullanıcı veritabanında doğrulandı: ${userData.id}`);
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
      status: EventStatus.PENDING,
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

export const getAllEvents = async () => {
  try {
    logger.info('Tüm etkinlikler getiriliyor');
    
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
      logger.error(`Etkinlikleri getirme hatası: ${error.message}`, error);
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
 * @returns Bugünkü etkinlik listesi frontend formatında
 */
export const getTodayEvents = async (userId?: string): Promise<any[]> => {
  try {
    // Bugünün başlangıç ve bitiş zamanlarını al
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    logger.info('Bugünün etkinlikleri alınıyor', {
      startOfToday: startOfToday.toISOString(),
      endOfToday: endOfToday.toISOString()
    });

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
      .eq('status', EventStatus.ACTIVE);
    
    if (error) {
      logger.error('Bugünün etkinlikleri alınırken hata oluştu:', error);
      throw new Error('Bugünün etkinlikleri alınırken bir hata oluştu.');
    }

    // Verileri frontend formatına dönüştür
    if (!events) return [];
    
    // Standart formatta tüm etkinlikleri döndür
    return events.map(event => formatEvent(event));
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

    // Yetki kontrolü
    const hasPermission = await canUpdateEventStatus(userId, existingEvent);
    if (!hasPermission) {
      throw new EventPermissionError('Bu etkinliği silme yetkiniz bulunmamaktadır.');
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
        .eq('related_event', eventId);
      
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
    const { data: event, error } = await supabase
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
    // Önce etkinlik detaylarını ve katılımcı sayısını kontrol et
    const { data: event, error: eventError } = await supabase
      .from('Events')
      .select(`
        max_participants,
        participants:Event_Participants (count)
      `)
      .eq('id', eventId)
      .single();

    if (eventError) {
      logger.error('Etkinlik bilgileri alınırken hata:', eventError);
      throw eventError;
    }

    // Katılımcı sayısını kontrol et
    const currentParticipants = event.participants[0].count;
    if (currentParticipants >= event.max_participants) {
      logger.warn(`Etkinlik dolu: eventId=${eventId}, maxParticipants=${event.max_participants}, currentParticipants=${currentParticipants}`);
      throw new Error('Bu etkinlik maksimum katılımcı sayısına ulaştı');
    }

    // Katılımcı ekle
    const { error: participantError } = await supabase
      .from('Event_Participants')
      .insert({
        event_id: eventId,
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      });

    if (participantError) {
      logger.error('Etkinliğe katılım eklenirken hata:', participantError);
      throw participantError;
    }

    logger.info(`Etkinliğe katılım başarılı: eventId=${eventId}, userId=${userId}, role=${role}`);
    return { success: true };
  } catch (error) {
    logger.error('Etkinliğe katılım sırasında hata:', error);
    throw error;
  }
}; 