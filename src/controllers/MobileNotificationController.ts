import { Request, Response } from 'express';
import { MobileNotificationService } from '../services/MobileNotificationService';
import { PushNotificationService } from '../services/PushNotificationService';
import { PlatformType, MobileNotificationType } from '../models/MobileNotification';
import logger from '../utils/logger';

export class MobileNotificationController {
  private mobileNotificationService: MobileNotificationService;
  private pushNotificationService: PushNotificationService;
  
  constructor() {
    this.mobileNotificationService = new MobileNotificationService();
    this.pushNotificationService = new PushNotificationService();
  }
  
  /**
   * Cihaz token'ını kaydeder
   */
  public registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceToken, deviceType, appVersion } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      if (!deviceToken || !deviceType) {
        res.status(400).json({ error: 'Device token ve device type zorunludur' });
        return;
      }
      
      // Platform kontrolü
      if (!Object.values(PlatformType).includes(deviceType as PlatformType)) {
        res.status(400).json({ error: 'Geçersiz device type. "ios" veya "android" olmalıdır' });
        return;
      }
      
      const device = await this.mobileNotificationService.registerDeviceToken(
        userId, 
        deviceToken, 
        deviceType as PlatformType, 
        appVersion
      );
      
      res.status(200).json({
        success: true,
        message: 'Cihaz token\'ı başarıyla kaydedildi',
        data: device
      });
    } catch (error) {
      logger.error('Cihaz token kayıt hatası:', error);
      res.status(500).json({ 
        error: 'Cihaz token\'ı kaydedilirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
  
  /**
   * Kullanıcının bildirimlerini getirir
   */
  public getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const readStatus = req.query.read_status === 'true' ? true : 
                         req.query.read_status === 'false' ? false : undefined;
      
      const { data, count } = await this.mobileNotificationService.getUserNotifications(
        userId, 
        limit, 
        offset,
        readStatus
      );
      
      res.status(200).json({
        success: true,
        count,
        data
      });
    } catch (error) {
      logger.error('Kullanıcı bildirimleri getirme hatası:', error);
      res.status(500).json({ 
        error: 'Bildirimler getirilirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
  
  /**
   * Bildirimi okundu olarak işaretler
   */
  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      const notificationId = parseInt(id);
      if (isNaN(notificationId)) {
        res.status(400).json({ error: 'Geçersiz bildirim ID' });
        return;
      }
      
      const notification = await this.mobileNotificationService.markAsRead(notificationId);
      
      res.status(200).json({
        success: true,
        message: 'Bildirim okundu olarak işaretlendi',
        data: notification
      });
    } catch (error) {
      logger.error('Bildirim okundu işaretleme hatası:', error);
      res.status(500).json({ 
        error: 'Bildirim okundu işaretlenirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
  
  /**
   * Tüm bildirimleri okundu olarak işaretler
   */
  public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      const count = await this.mobileNotificationService.markAllAsRead(userId);
      
      res.status(200).json({
        success: true,
        message: `${count} bildirim okundu olarak işaretlendi`,
        count
      });
    } catch (error) {
      logger.error('Tüm bildirimleri okundu işaretleme hatası:', error);
      res.status(500).json({ 
        error: 'Bildirimler okundu işaretlenirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
  
  /**
   * Okunmamış bildirim sayısını getirir
   */
  public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      const count = await this.mobileNotificationService.getUnreadCount(userId);
      
      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      logger.error('Okunmamış bildirim sayısı getirme hatası:', error);
      res.status(500).json({ 
        error: 'Okunmamış bildirim sayısı getirilirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
  
  /**
   * Test bildirimi gönderir (sadece geliştirme amaçlı)
   */
  public sendTestNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceToken, platform, title, body, data } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Yetkilendirme hatası' });
        return;
      }
      
      if (!deviceToken || !platform || !title || !body) {
        res.status(400).json({ error: 'deviceToken, platform, title ve body alanları zorunludur' });
        return;
      }
      
      // Platform kontrolü
      if (!Object.values(PlatformType).includes(platform as PlatformType)) {
        res.status(400).json({ error: 'Geçersiz platform. "ios" veya "android" olmalıdır' });
        return;
      }
      
      // Test bildirimi oluştur
      const notification = await this.mobileNotificationService.createNotification({
        user_id: userId,
        title,
        body,
        data,
        notification_type: MobileNotificationType.SYSTEM_NOTIFICATION,
        device_token: deviceToken,
        platform: platform as PlatformType
      });
      
      // Bildirimi gönder
      const success = await this.pushNotificationService.sendNotification(notification);
      
      res.status(200).json({
        success,
        message: success ? 'Test bildirimi başarıyla gönderildi' : 'Test bildirimi gönderilemedi',
        data: notification
      });
    } catch (error) {
      logger.error('Test bildirimi gönderme hatası:', error);
      res.status(500).json({ 
        error: 'Test bildirimi gönderilirken bir hata oluştu',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  };
}
