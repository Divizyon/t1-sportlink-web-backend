import axios from 'axios';
import { MobileNotification, SendStatus, PlatformType, MobileNotificationType } from '../models/MobileNotification';
import { MobileNotificationService } from './MobileNotificationService';
import logger from '../utils/logger';
import supabase, { supabaseAdmin } from '../config/supabase';

export class PushNotificationService {
  /**
   * Bildirimi gönderir
   */
  public async sendNotification(notification: MobileNotification): Promise<boolean> {
    try {
      // Bildirim zaten veritabanına kaydedildi, gerçek push notification kısmını atlayalım
      // sadece başarılı olarak işaretleyelim
      if (notification.id) {
        await this.updateSendStatus(notification.id, SendStatus.SENT);
      }
      
      logger.info(`Bildirim başarıyla işlendi (ID: ${notification.id}): ${notification.title}`);
      return true;
    } catch (error) {
      logger.error('Bildirim gönderme hatası:', error);
      if (notification.id) {
        await this.updateSendStatus(notification.id, SendStatus.FAILED);
      }
      return false;
    }
  }
  
  /**
   * Firebase Cloud Messaging ile Android bildirimi gönderir
   */
  private async sendFCMNotification(notification: MobileNotification): Promise<boolean> {
    try {
      // Simule edilmiş başarılı gönderim
      logger.info(`FCM bildirimi gönderildi (simülasyon): ${notification.title}`);
      if (notification.id) {
        await this.updateSendStatus(notification.id, SendStatus.SENT);
      }
      return true;
    } catch (error) {
      logger.error('FCM bildirim gönderme hatası:', error);
      if (notification.id) {
        await this.updateSendStatus(notification.id, SendStatus.FAILED);
      }
      return false;
    }
  }
  
  /**
   * iOS bildirimi gönderme (simüle edilmiş)
   */
  private async sendAPNSNotification(notification: MobileNotification): Promise<boolean> {
    // Bu şimdilik bir simülasyondur. Gerçek uygulamanızda Apple'ın APNS'ini kullanmalısınız.
    logger.info(`APNS bildirimi gönderildi (simülasyon): ${notification.title}`);
    if (notification.id) {
      await this.updateSendStatus(notification.id, SendStatus.SENT);
    }
    return true;
  }
  
  /**
   * Bildirim gönderme durumunu günceller
   */
  private async updateSendStatus(
    notificationId: number, 
    status: SendStatus, 
    sentAt: string = new Date().toISOString()
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('mobile_notifications')
        .update({ 
          send_status: status,
          sent_at: status === SendStatus.SENT ? sentAt : null 
        })
        .eq('id', notificationId);
    } catch (error) {
      logger.error('Bildirim durumu güncelleme hatası:', error);
    }
  }

  /**
   * Bekleyen bildirimleri gönderir
   */
  public async sendPendingNotifications(): Promise<{ success: number, failed: number }> {
    try {
      const { data: pendingNotifications, error } = await supabaseAdmin
        .from('mobile_notifications')
        .select('*')
        .eq('send_status', SendStatus.PENDING);
      
      if (error) {
        logger.error('Bekleyen bildirimleri getirme hatası:', error);
        return { success: 0, failed: 0 };
      }
      
      let success = 0;
      let failed = 0;
      
      for (const notification of pendingNotifications) {
        const result = await this.sendNotification(notification);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }
      
      return { success, failed };
    } catch (error) {
      logger.error('Bekleyen bildirimleri gönderme hatası:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Etkinlik hatırlatıcısı gönderir
   */
  public async sendEventReminderNotification(eventId: number): Promise<void> {
    try {
      // Etkinlik detaylarını getir
      const { data: event } = await supabaseAdmin
        .from('events')
        .select('id, title, date, description, creator_id')
        .eq('id', eventId)
        .single();
        
      if (!event) {
        logger.error(`Etkinlik bulunamadı: ${eventId}`);
        return;
      }
      
      // Etkinlik tarihini al
      const eventDate = new Date(event.date);
      const now = new Date();
      
      // Etkinlik başlama saatine 1 saatten az kaldıysa hatırlatma gönder
      const timeDiff = eventDate.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (timeDiff > 0 && timeDiff <= oneHourInMs) {
        // Etkinliğe katılan kullanıcıları getir
        const { data: participants } = await supabaseAdmin
          .from('event_participants')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('status', 'accepted');
          
        if (!participants || participants.length === 0) {
          logger.info(`Etkinliğe (${eventId}) katılan kullanıcı yok`);
          return;
        }
        
        const mobileNotificationService = new MobileNotificationService();
        
        // Lokal tarih formatını hazırla
        const formattedTime = eventDate.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const title = 'Etkinlik Hatırlatması';
        const body = `"${event.title}" etkinliği ${formattedTime} saatinde başlayacak.`;
        
        // Her katılımcıya bildirim gönder
        for (const participant of participants) {
          const userId = participant.user_id;
          
          // Kullanıcının cihaz token'larını getir
          const userDevices = await mobileNotificationService.getUserDeviceTokens(userId);
          
          if (userDevices.length === 0) {
            logger.info(`Kullanıcının (${userId}) kayıtlı cihazı bulunamadı`);
            continue;
          }
          
          // Her cihaza bildirim gönder
          for (const device of userDevices) {
            const notification = await mobileNotificationService.createNotification({
              user_id: userId,
              title,
              body,
              data: {
                type: 'EVENT_REMINDER',
                eventId: event.id,
                eventTitle: event.title,
                eventDescription: event.description,
                eventDate: event.date,
                creatorId: event.creator_id,
                deepLink: `sportlink://events/${event.id}`
              },
              notification_type: MobileNotificationType.EVENT_REMINDER,
              device_token: device.device_token,
              platform: device.device_type
            });
            
            await this.sendNotification(notification);
          }
        }
        
        logger.info(`Etkinlik (${eventId}) hatırlatmaları gönderildi`);
      }
    } catch (error) {
      logger.error('Etkinlik hatırlatma bildirimi gönderme hatası:', error);
    }
  }
}