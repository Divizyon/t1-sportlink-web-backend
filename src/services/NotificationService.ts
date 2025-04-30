import { supabase } from '../utils/supabaseClient';
import supabaseAdmin from '../utils/supabaseClient';
import { 
  Notification, 
  NotificationType, 
  CreateNotificationParams,
  ListNotificationsParams 
} from '../types/Notification';

export class NotificationService {
  
  /**
   * Yeni bildirim oluşturur
   * @param params Bildirim parametreleri
   * @returns Oluşturulan bildirim
   */
  public async createNotification(params: CreateNotificationParams): Promise<Notification> {
    try {
      const { notification_type, content, event_id, user_id, link } = params;
      
      console.log(`Yeni bildirim oluşturuluyor: ${notification_type} - ${content}`);
      
      const { data, error } = await supabaseAdmin
        .from('Notifications')
        .insert({
          notification_type,
          content,
          read_status: false,
          created_at: new Date(),
          event_id,
          user_id,
          link
        })
        .select()
        .single();
        
      if (error) {
        console.error('Bildirim oluşturma hatası:', error);
        throw new Error(`Bildirim oluşturulamadı: ${error.message}`);
      }
      
      console.log('Bildirim başarıyla oluşturuldu:', data);
      return data;
    } catch (error: any) {
      console.error('Bildirim oluşturma hatası:', error);
      throw new Error(`Bildirim oluşturulamadı: ${error.message}`);
    }
  }
  
  /**
   * Bildirim listesini getirir
   * @param params Listeleme parametreleri
   * @returns Bildirim listesi ve toplam sayı
   */
  public async listNotifications(params: ListNotificationsParams = {}): Promise<{data: Notification[], count: number}> {
    try {
      const { user_id, read_status, limit = 10, offset = 0 } = params;
      
      let query = supabaseAdmin
        .from('Notifications')
        .select('*', { count: 'exact' });
        
      // Filtreler
      if (user_id) query = query.eq('user_id', user_id);
      if (read_status !== undefined) query = query.eq('read_status', read_status);
      
      // Sorguyu çalıştır
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error('Bildirim listesi alınırken hata:', error);
        throw new Error(`Bildirim listesi alınamadı: ${error.message}`);
      }
      
      return { data: data || [], count: count || 0 };
    } catch (error: any) {
      console.error('Bildirim listesi alınırken hata:', error);
      throw new Error(`Bildirim listesi alınamadı: ${error.message}`);
    }
  }
  
  /**
   * Bildirimi okundu olarak işaretler
   * @param id Bildirim ID
   * @returns Güncellenen bildirim
   */
  public async markAsRead(id: number): Promise<Notification> {
    try {
      console.log(`Bildirim okundu olarak işaretleniyor: ID=${id}`);
      
      const { data, error } = await supabaseAdmin
        .from('Notifications')
        .update({ read_status: true })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Bildirim güncelleme hatası:', error);
        throw new Error(`Bildirim güncellenemedi: ${error.message}`);
      }
      
      console.log('Bildirim okundu olarak işaretlendi');
      return data;
    } catch (error: any) {
      console.error('Bildirim güncelleme hatası:', error);
      throw new Error(`Bildirim güncellenemedi: ${error.message}`);
    }
  }
  
  /**
   * Tüm bildirimleri okundu olarak işaretler
   * @param user_id Kullanıcı ID
   * @returns İşlem sonucu
   */
  public async markAllAsRead(user_id: string): Promise<{success: boolean, count: number}> {
    try {
      console.log(`Tüm bildirimler okundu olarak işaretleniyor: user_id=${user_id}`);
      
      const { data, error } = await supabaseAdmin
        .from('Notifications')
        .update({ read_status: true })
        .eq('user_id', user_id)
        .eq('read_status', false)
        .select();
        
      if (error) {
        console.error('Toplu bildirim güncelleme hatası:', error);
        throw new Error(`Bildirimler güncellenemedi: ${error.message}`);
      }
      
      console.log(`${data?.length || 0} bildirim okundu olarak işaretlendi`);
      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Toplu bildirim güncelleme hatası:', error);
      throw new Error(`Bildirimler güncellenemedi: ${error.message}`);
    }
  }
  
  /**
   * Bildirimi siler
   * @param id Bildirim ID
   * @returns İşlem sonucu
   */
  public async deleteNotification(id: number): Promise<{success: boolean}> {
    try {
      console.log(`Bildirim siliniyor: ID=${id}`);
      
      const { error } = await supabaseAdmin
        .from('Notifications')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Bildirim silme hatası:', error);
        throw new Error(`Bildirim silinemedi: ${error.message}`);
      }
      
      console.log('Bildirim başarıyla silindi');
      return { success: true };
    } catch (error: any) {
      console.error('Bildirim silme hatası:', error);
      throw new Error(`Bildirim silinemedi: ${error.message}`);
    }
  }
  
  /**
   * Kullanıcının okunmamış bildirim sayısını getirir
   * @param user_id Kullanıcı ID
   * @returns Okunmamış bildirim sayısı
   */
  public async getUnreadCount(user_id: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('Notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('read_status', false);
        
      if (error) {
        console.error('Okunmamış bildirim sayısı alınırken hata:', error);
        throw new Error(`Okunmamış bildirim sayısı alınamadı: ${error.message}`);
      }
      
      return count || 0;
    } catch (error: any) {
      console.error('Okunmamış bildirim sayısı alınırken hata:', error);
      throw new Error(`Okunmamış bildirim sayısı alınamadı: ${error.message}`);
    }
  }
  
  /**
   * Belirli bir olaya bildirim oluşturur
   * @param type Bildirim tipi
   * @param content Bildirim içeriği
   * @param event_id İlgili olay ID
   * @param user_ids Bildirim gönderilecek kullanıcı ID'leri
   * @param link İsteğe bağlı yönlendirme linki
   * @returns Oluşturulan bildirimler
   */
  public async createEventNotification(
    type: NotificationType,
    content: string,
    event_id: number,
    user_ids: string[],
    link?: string
  ): Promise<Notification[]> {
    try {
      console.log(`Olay bildirimi oluşturuluyor: ${type}, ${user_ids.length} kullanıcı için`);
      
      const notifications: Notification[] = [];
      
      for (const user_id of user_ids) {
        const notification = await this.createNotification({
          notification_type: type,
          content,
          event_id,
          user_id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Olay bildirimi oluşturma hatası:', error);
      throw new Error(`Olay bildirimi oluşturulamadı: ${error.message}`);
    }
  }
  
  /**
   * Admin kullanıcıları getirir
   * @returns Admin kullanıcı listesi
   */
  private async getAdminUsers(): Promise<{id: string}[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'ADMIN');
      
    if (error) {
      console.error('Admin kullanıcıları alırken hata:', error);
      throw new Error(`Admin kullanıcıları alınamadı: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Yeni etkinlik oluşturulduğunda tüm adminlere bildirim gönderir
   * @param eventId Etkinlik ID
   * @param eventTitle Etkinlik başlığı
   * @param creatorName Etkinliği oluşturan kullanıcı adı
   * @returns Oluşturulan bildirimler
   */
  public async notifyAdminsNewEvent(eventId: number, eventTitle: string, creatorName: string): Promise<Notification[]> {
    try {
      const content = `Yeni etkinlik: "${eventTitle}" (${creatorName} tarafından)`;
      const link = `/admin/events/${eventId}`;
      
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.NEW_EVENT,
          content,
          event_id: eventId,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Etkinlik bildirimi oluşturma hatası:', error);
      throw new Error(`Etkinlik bildirimi oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Etkinlik güncellendiğinde tüm adminlere bildirim gönderir
   * @param eventId Etkinlik ID
   * @param eventTitle Etkinlik başlığı
   * @param updaterName Etkinliği güncelleyen kullanıcı adı
   * @returns Oluşturulan bildirimler
   */
  public async notifyAdminsEventUpdated(eventId: number, eventTitle: string, updaterName: string): Promise<Notification[]> {
    try {
      const content = `Etkinlik güncellendi: "${eventTitle}" (${updaterName} tarafından)`;
      const link = `/admin/events/${eventId}`;
      
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.EVENT_UPDATED,
          content,
          event_id: eventId,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Etkinlik güncelleme bildirimi oluşturma hatası:', error);
      throw new Error(`Etkinlik güncelleme bildirimi oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Kullanıcı izlemeye alındığında tüm adminlere bildirim gönderir
   * @param userId İzlemeye alınan kullanıcı ID
   * @param userName Kullanıcı adı
   * @param watcherName İzlemeye alan admin adı
   * @returns Oluşturulan bildirimler
   */
  public async notifyAdminsUserWatched(userId: string, userName: string, watcherName: string): Promise<Notification[]> {
    try {
      const content = `Kullanıcı izlemeye alındı: "${userName}" (${watcherName} tarafından)`;
      const link = `/admin/users/${userId}`;
      
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.USER_WATCHED,
          content,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Kullanıcı izleme bildirimi oluşturma hatası:', error);
      throw new Error(`Kullanıcı izleme bildirimi oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Kullanıcı inaktif olduğunda tüm adminlere bildirim gönderir
   * @param userId İnaktif olan kullanıcı ID
   * @param userName Kullanıcı adı
   * @param reason İnaktif olma nedeni (isteğe bağlı)
   * @returns Oluşturulan bildirimler
   */
  public async notifyAdminsUserInactive(userId: string, userName: string, reason?: string): Promise<Notification[]> {
    try {
      const content = reason 
        ? `Kullanıcı inaktif: "${userName}" (Neden: ${reason})`
        : `Kullanıcı inaktif: "${userName}"`;
      const link = `/admin/users/${userId}`;
      
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.USER_INACTIVE,
          content,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Kullanıcı inaktif bildirimi oluşturma hatası:', error);
      throw new Error(`Kullanıcı inaktif bildirimi oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Yeni rapor oluşturulduğunda tüm adminlere bildirim gönderir
   * @param reportId Rapor ID
   * @param reportTitle Rapor başlığı
   * @param reporterName Raporu oluşturan kullanıcı adı
   * @returns Oluşturulan bildirimler
   */
  public async notifyAdminsNewReport(reportId: number, reportTitle: string, reporterName: string): Promise<Notification[]> {
    try {
      const content = `Yeni rapor: "${reportTitle}" (${reporterName} tarafından)`;
      const link = `/admin/reports/${reportId}`;
      
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.NEW_REPORT,
          content,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Rapor bildirimi oluşturma hatası:', error);
      throw new Error(`Rapor bildirimi oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Admin kullanıcılara sistem bildirimi oluşturur
   * @param content Bildirim içeriği
   * @param link İsteğe bağlı yönlendirme linki
   * @returns Oluşturulan bildirimler
   */
  public async createSystemNotification(content: string, link?: string): Promise<Notification[]> {
    try {
      // Admin kullanıcıları al
      const adminUsers = await this.getAdminUsers();
      
      const notifications: Notification[] = [];
      
      for (const admin of adminUsers || []) {
        const notification = await this.createNotification({
          notification_type: NotificationType.SYSTEM_ALERT,
          content,
          user_id: admin.id,
          link
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error: any) {
      console.error('Sistem bildirimi oluşturma hatası:', error);
      throw new Error(`Sistem bildirimi oluşturulamadı: ${error.message}`);
    }
  }
} 