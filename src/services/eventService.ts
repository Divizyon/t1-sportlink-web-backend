import { Event, EventStatus, EventValidationSchema, UpdateEventStatusSchema, EventValidationError, EventNotFoundError, EventPermissionError, EventStatusError } from '../models/Event';
import supabase from '../config/supabase';
import { parseISO, addHours, isBefore, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

const convertToUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

const convertFromUTC = (date: Date): Date => {
  return toZonedTime(date, DEFAULT_TIMEZONE);
};

export const findEventById = async (id: string): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        participants:event_participants(
          id,
          user_id,
          role,
          joined_at
        ),
        ratings:event_ratings(
          id,
          rating,
          review,
          created_at
        ),
        reports:event_reports(
          id,
          reporter_id,
          report_reason,
          report_date,
          status,
          admin_notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Find event error:', error);
      throw new EventNotFoundError(id);
    }

    if (!data) {
      throw new EventNotFoundError(id);
    }

    // Tarihleri yerel zaman dilimine çevir
    const event = {
      ...data,
      event_date: convertFromUTC(parseISO(data.event_date)),
      start_time: convertFromUTC(parseISO(data.start_time)),
      end_time: convertFromUTC(parseISO(data.end_time)),
      created_at: convertFromUTC(parseISO(data.created_at)),
      updated_at: convertFromUTC(parseISO(data.updated_at))
    };

    // Validasyon
    const validationResult = EventValidationSchema.safeParse(event);
    if (!validationResult.success) {
      throw new EventValidationError(validationResult.error.message);
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof EventNotFoundError || 
        error instanceof EventValidationError) {
      throw error;
    }
    console.error('Find event error:', error);
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

    return data?.role === 'admin';
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
    // İptal edilmiş veya tamamlanmış etkinlik kontrolü
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      return {
        isValid: false,
        message: 'İptal edilmiş veya tamamlanmış etkinlikler güncellenemez.'
      };
    }

    // Tarihi geçmiş etkinlik kontrolü
    const now = new Date();
    if (isBefore(event.end_time, now)) {
      if (newStatus !== EventStatus.COMPLETED) {
        return {
          isValid: false,
          message: 'Süresi dolmuş etkinlik sadece tamamlandı olarak işaretlenebilir.'
        };
      }
      return { isValid: true, message: '' };
    }

    // İptal durumu için 24 saat kontrolü
    if (newStatus === EventStatus.CANCELLED) {
      const eventStartTime = event.start_time;
      const hoursDifference = (eventStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDifference < 24) {
        return {
          isValid: false,
          message: 'Etkinliğin başlamasına 24 saatten az kaldığı için iptal edilemez.'
        };
      }
    }

    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Validate status update error:', error);
    throw new EventValidationError('Durum güncelleme validasyonu sırasında bir hata oluştu.');
  }
};

export const updateEventStatus = async (
  eventId: string,
  status: EventStatus,
  userId: string
): Promise<Event> => {
  try {
    // Status validasyonu
    const statusValidation = UpdateEventStatusSchema.safeParse({ status });
    if (!statusValidation.success) {
      throw new EventValidationError('Geçersiz etkinlik durumu.');
    }

    // Etkinliği bul
    const event = await findEventById(eventId);

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
    const { data, error } = await supabase
      .from('events')
      .update({ 
        status,
        updated_at: convertToUTC(new Date()).toISOString()
      })
      .eq('id', eventId)
      .eq('status', event.status) // Concurrent update kontrolü
      .select()
      .single();

    if (error) {
      console.error('Update event status error:', error);
      throw new Error('Etkinlik durumu güncellenirken bir hata oluştu.');
    }

    if (!data) {
      throw new EventStatusError('Etkinlik durumu başka bir kullanıcı tarafından değiştirilmiş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
    }

    return await findEventById(eventId);
  } catch (error) {
    if (error instanceof EventNotFoundError || 
        error instanceof EventPermissionError || 
        error instanceof EventStatusError ||
        error instanceof EventValidationError) {
      throw error;
    }
    console.error('Update event status error:', error);
    throw error;
  }
};

export const markExpiredEventsAsCompleted = async (): Promise<void> => {
  try {
    const now = convertToUTC(new Date());
    const { error } = await supabase
      .from('events')
      .update({ 
        status: EventStatus.COMPLETED,
        updated_at: now.toISOString()
      })
      .eq('status', EventStatus.ACTIVE)
      .lt('end_time', now.toISOString());

    if (error) {
      console.error('Mark completed events error:', error);
      throw new Error('Süresi dolmuş etkinlikler tamamlandı olarak işaretlenirken bir hata oluştu.');
    }
  } catch (error) {
    console.error('Mark completed events error:', error);
    throw error;
  }
}; 