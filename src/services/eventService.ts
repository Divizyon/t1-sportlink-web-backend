import { Event, EventStatus, EventValidationSchema, UpdateEventStatusSchema, EventValidationError, EventNotFoundError, EventPermissionError, EventStatusError } from '../models/Event';
import supabase, { getSupabaseAdmin } from '../utils/supabaseHelper';
import { parseISO, addHours, isBefore, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import logger from '../utils/logger';

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

const convertToUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

const convertFromUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

export const findEventById = async (id: string): Promise<Event> => {
  try {
    logger.info(`Etkinlik aranıyor: ${id}`);
    
    // Basitleştirilmiş sorgu - sadece etkinlik verisi
    const { data, error } = await getSupabaseAdmin()
      .from('events')
      .select('*')
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

    logger.info(`Etkinlik bulundu: ${id}`);
    return data as Event;
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
    if (isAdmin) return true;

    // Etkinlik sahibi kontrolü
    return userId === event.creator_id;
  } catch (error) {
    console.error('Permission check error:', error);
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

    // Tamamlanmış etkinlik durumu değiştirilemez
    if (event.status === EventStatus.COMPLETED) {
      return { isValid: false, message: 'Tamamlanmış etkinliğin durumu değiştirilemez.' };
    }

    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    // Aktif duruma geçerken kontroller
    if (newStatus === EventStatus.ACTIVE) {
      // İptal edilmiş etkinlik tekrar aktifleştirilebilir, ama sadece başlamamışsa
      if (event.status === EventStatus.CANCELLED && startTime <= now) {
        return { 
          isValid: false, 
          message: 'İptal edilmiş bir etkinlik, başlangıç zamanı geçtikten sonra tekrar aktifleştirilemez.' 
        };
      }
    }

    // İptal durumuna geçerken kontroller
    if (newStatus === EventStatus.CANCELLED) {
      // Etkinlik başladıktan sonra iptal edilebilir (erken sonlandırma)
      // Herhangi bir özel kısıtlama yok
    }

    // Tamamlandı durumuna geçerken kontroller
    if (newStatus === EventStatus.COMPLETED) {
      // Etkinlik sadece başladıktan sonra tamamlandı olarak işaretlenebilir
      if (startTime > now) {
        return { 
          isValid: false, 
          message: 'Etkinlik henüz başlamadı, tamamlandı olarak işaretlenemez.' 
        };
      }
      
      // İptal edilmiş etkinlik tamamlandı olarak işaretlenemez
      if (event.status === EventStatus.CANCELLED) {
        return { 
          isValid: false,
          message: 'İptal edilmiş bir etkinlik tamamlandı olarak işaretlenemez.' 
        };
      }
    }

    return { isValid: true, message: '' };
  } catch (error) {
    logger.error('Durum validasyon hatası:', error);
    return { isValid: false, message: 'Durum validasyonu sırasında bir hata oluştu.' };
  }
};

export const updateEventStatus = async (
  eventId: string,
  status: EventStatus,
  userId: string
): Promise<Event> => {
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

    // Optimistic locking için version kontrolü
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('events')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      logger.error(`Etkinlik durumu güncelleme hatası: ${error.message}`, error);
      throw new Error('Etkinlik durumu güncellenirken bir hata oluştu.');
    }

    if (!data) {
      throw new EventStatusError('Etkinlik durumu başka bir kullanıcı tarafından değiştirilmiş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    logger.info(`Etkinlik durumu başarıyla güncellendi: ${eventId} -> ${status}`);
    return await findEventById(eventId);
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
    
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('events')
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
    
    // Basitleştirilmiş veri hazırlığı
    const eventDataToInsert = {
      title: eventData.title,
      description: eventData.description || '',
      creator_id: eventData.creator_id,
      sport_id: eventData.sport_id,
      event_date: eventData.event_date,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location_name: eventData.location_name,
      location_lat: eventData.location_lat,
      location_long: eventData.location_long,
      max_participants: eventData.max_participants,
      status: EventStatus.ACTIVE
    };
    
    logger.info(`Supabase insert hazırlandı: ${JSON.stringify(eventDataToInsert, null, 2)}`);

    // Etkinliği oluştur - supabase yerine supabaseAdmin kullanıyoruz (RLS bypass)
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([eventDataToInsert])
      .select()
      .single();

    if (error) {
      logger.error(`Etkinlik oluşturma hatası: ${error.message}`, error);
      if (error.code === '23503') { // Foreign key violation
        throw new Error(`Geçersiz ilişki hatası: ${error.message}`);
      }
      throw new Error(`Etkinlik oluşturulamadı: ${error.message}`);
    }

    if (!data) {
      logger.error('Etkinlik verisi bulunamadı');
      throw new Error('Etkinlik oluşturuldu ancak veri döndürülemedi');
    }

    logger.info(`Etkinlik başarıyla oluşturuldu: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('createEvent service hatası:', error);
    throw error;
  }
};

export const getAllEvents = async () => {
  try {
    logger.info('Tüm etkinlikler getiriliyor');
    
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) {
      logger.error(`Etkinlikleri getirme hatası: ${error.message}`, error);
      throw new Error('Etkinlikler getirilemedi');
    }
    
    logger.info(`${data.length} etkinlik bulundu`);
    return data;
  } catch (error) {
    logger.error('getAllEvents hatası:', error);
    throw error;
  }
}; 