import supabase,{  supabaseAdmin } from '../config/supabase';
import { 
  MobileNotification, 
  CreateMobileNotificationDTO, 
  MobileNotificationType,
  SendStatus,
  UserDevice,
  PlatformType
} from '../models/MobileNotification';
import logger from '../utils/logger';

export class MobileNotificationService {
  
  /**
   * Kullanıcı cihaz token'ını kaydeder
   */
  public async registerDeviceToken(
    userId: string, 
    deviceToken: string, 
    deviceType: PlatformType,
    appVersion?: string
  ): Promise<UserDevice> {
    try {
      logger.info(`Cihaz token'ı kaydediliyor: ${deviceType} - ${deviceToken.substring(0, 10)}...`);
      
      const { data, error } = await supabaseAdmin
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_token: deviceToken,
          device_type: deviceType,
          app_version: appVersion,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, device_token',
          ignoreDuplicates: false
        })
        .select()
        .single();
        
      if (error) {
        logger.error('Cihaz token kayıt hatası:', error);
        throw new Error(`Cihaz token'ı kaydedilemedi: ${error.message}`);
      }
      
      logger.info('Cihaz token\'ı başarıyla kaydedildi');
      return data;
    } catch (error: any) {
      logger.error('Cihaz token kayıt hatası:', error);
      throw new Error(`Cihaz token'ı kaydedilemedi: ${error.message}`);
    }
  }
  
  /**
   * Kullanıcının cihaz token'larını getirir
   */
  public async getUserDeviceTokens(userId: string): Promise<UserDevice[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        logger.error('Kullanıcı cihaz token\'ları getirme hatası:', error);
        throw new Error(`Kullanıcı cihaz token'ları getirilemedi: ${error.message}`);
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Kullanıcı cihaz token\'ları getirme hatası:', error);
      throw new Error(`Kullanıcı cihaz token'ları getirilemedi: ${error.message}`);
    }
  }
  
  /**
   * Bildirim oluşturur
   */
  public async createNotification(notification: CreateMobileNotificationDTO): Promise<MobileNotification> {
    try {
      logger.info(`Mobil bildirim oluşturuluyor: ${notification.title}`);
      
      // Log ekstra verileri
      logger.info(`Bildirim detayları: user_id=${notification.user_id}, type=${notification.notification_type}`);
      
      const { data, error } = await supabaseAdmin
        .from('mobile_notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          read_status: false,
          send_status: SendStatus.PENDING,
          notification_type: notification.notification_type,
          created_at: new Date().toISOString(),
          device_token: notification.device_token || null,
          platform: notification.platform || null
        })
        .select()
        .single();
        
      if (error) {
        logger.error('Mobil bildirim oluşturma hatası:', error);
        throw new Error(`Mobil bildirim oluşturulamadı: ${error.message}`);
      }
      
      logger.info(`Mobil bildirim başarıyla oluşturuldu: ID=${data.id}`);
      return data;
    } catch (error: any) {
      logger.error('Mobil bildirim oluşturma hatası:', error);
      throw new Error(`Mobil bildirim oluşturulamadı: ${error.message}`);
    }
  }
  
  /**
   * Kullanıcının bildirimlerini getirir
   */
  public async getUserNotifications(
    userId: string, 
    limit: number = 20, 
    offset: number = 0,
    readStatus?: boolean
  ): Promise<{ data: MobileNotification[], count: number }> {
    try {
      let query = supabaseAdmin
        .from('mobile_notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
        
      if (readStatus !== undefined) {
        query = query.eq('read_status', readStatus);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        logger.error('Kullanıcı bildirimleri getirme hatası:', error);
        throw new Error(`Kullanıcı bildirimleri getirilemedi: ${error.message}`);
      }
      
      return { data: data || [], count: count || 0 };
    } catch (error: any) {
      logger.error('Kullanıcı bildirimleri getirme hatası:', error);
      throw new Error(`Kullanıcı bildirimleri getirilemedi: ${error.message}`);
    }
  }
  
  /**
   * Bildirimi okundu olarak işaretler
   */
  public async markAsRead(notificationId: number): Promise<MobileNotification> {
    try {
      const { data, error } = await supabaseAdmin
        .from('mobile_notifications')
        .update({ read_status: true })
        .eq('id', notificationId)
        .select()
        .single();
        
      if (error) {
        logger.error('Bildirim okundu işaretleme hatası:', error);
        throw new Error(`Bildirim okundu işaretlenemedi: ${error.message}`);
      }
      
      return data;
    } catch (error: any) {
      logger.error('Bildirim okundu işaretleme hatası:', error);
      throw new Error(`Bildirim okundu işaretlenemedi: ${error.message}`);
    }
  }
  
  /**
   * Tüm bildirimleri okundu olarak işaretler
   */
  public async markAllAsRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('mobile_notifications')
        .update({ read_status: true })
        .eq('user_id', userId)
        .eq('read_status', false)
        .select();
        
      if (error) {
        logger.error('Tüm bildirimleri okundu işaretleme hatası:', error);
        throw new Error(`Tüm bildirimler okundu işaretlenemedi: ${error.message}`);
      }
      
      return data?.length || 0;
    } catch (error: any) {
      logger.error('Tüm bildirimleri okundu işaretleme hatası:', error);
      throw new Error(`Tüm bildirimler okundu işaretlenemedi: ${error.message}`);
    }
  }
  
  /**
   * Bildirim gönderme durumunu günceller
   */
  public async updateSendStatus(
    notificationId: number, 
    status: SendStatus, 
    sentAt: string = new Date().toISOString()
  ): Promise<MobileNotification> {
    try {
      const { data, error } = await supabaseAdmin
        .from('mobile_notifications')
        .update({ 
          send_status: status,
          sent_at: status === SendStatus.SENT ? sentAt : null 
        })
        .eq('id', notificationId)
        .select()
        .single();
        
      if (error) {
        logger.error('Bildirim gönderme durumu güncelleme hatası:', error);
        throw new Error(`Bildirim gönderme durumu güncellenemedi: ${error.message}`);
      }
      
      return data;
    } catch (error: any) {
      logger.error('Bildirim gönderme durumu güncelleme hatası:', error);
      throw new Error(`Bildirim gönderme durumu güncellenemedi: ${error.message}`);
    }
  }
  
  /**
   * Okunmamış bildirim sayısını getirir
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('mobile_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read_status', false);
        
      if (error) {
        logger.error('Okunmamış bildirim sayısı getirme hatası:', error);
        throw new Error(`Okunmamış bildirim sayısı getirilemedi: ${error.message}`);
      }
      
      return count || 0;
    } catch (error: any) {
      logger.error('Okunmamış bildirim sayısı getirme hatası:', error);
      throw new Error(`Okunmamış bildirim sayısı getirilemedi: ${error.message}`);
    }
  }
}
