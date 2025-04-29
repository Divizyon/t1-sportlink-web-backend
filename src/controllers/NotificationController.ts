import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { NotificationType } from '../types/Notification';
import logger from '../utils/logger';

export class NotificationController {
  private notificationService: NotificationService;
  
  constructor() {
    this.notificationService = new NotificationService();
  }
  
  /**
   * Bildirim listesini getirir
   * @route GET /api/notifications
   */
  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      // Kullanıcı ID'sini token'dan al
      const userId = req.userProfile?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Oturum açmanız gerekiyor'
        });
        return;
      }

      const { read_status, limit, offset } = req.query;
      
      // Parametre dönüşümleri
      const params = {
        user_id: userId,
        read_status: read_status === 'true' ? true : read_status === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };
      
      logger.info(`${userId} kullanıcısı için bildirimler isteniyor`, params);
      
      const { data: notifications, count } = await this.notificationService.listNotifications(params);
      
      res.status(200).json({
        status: 'success',
        count,
        data: notifications
      });
    } catch (error: any) {
      logger.error('Bildirim listesi alınırken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Bildirim listesi alınırken bir hata oluştu'
      });
    }
  };
  
  /**
   * Kullanıcının okunmamış bildirim sayısını getirir
   * @route GET /api/notifications/unread-count
   */
  public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      // Kullanıcı ID'sini token'dan al
      const userId = req.userProfile?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Oturum açmanız gerekiyor'
        });
        return;
      }
      
      const count = await this.notificationService.getUnreadCount(userId);
      
      res.status(200).json({
        status: 'success',
        data: { count }
      });
    } catch (error: any) {
      logger.error('Okunmamış bildirim sayısı alınırken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Okunmamış bildirim sayısı alınırken bir hata oluştu'
      });
    }
  };
  
  /**
   * Bildirimi okundu olarak işaretler
   * @route PATCH /api/notifications/:id/read
   */
  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          status: 'error',
          message: 'Geçerli bir bildirim ID gereklidir'
        });
        return;
      }
      
      const notification = await this.notificationService.markAsRead(Number(id));
      
      res.status(200).json({
        status: 'success',
        message: 'Bildirim okundu olarak işaretlendi',
        data: notification
      });
    } catch (error: any) {
      logger.error('Bildirim okundu işaretlenirken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Bildirim okundu işaretlenirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Tüm bildirimleri okundu olarak işaretler
   * @route PATCH /api/notifications/mark-all-read
   */
  public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      // Kullanıcı ID'sini token'dan al
      const userId = req.userProfile?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Oturum açmanız gerekiyor'
        });
        return;
      }
      
      const result = await this.notificationService.markAllAsRead(userId);
      
      res.status(200).json({
        status: 'success',
        message: `${result.count} bildirim okundu olarak işaretlendi`,
        data: result
      });
    } catch (error: any) {
      logger.error('Tüm bildirimler okundu işaretlenirken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Bildirimler okundu işaretlenirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Bildirimi siler
   * @route DELETE /api/notifications/:id
   */
  public deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          status: 'error',
          message: 'Geçerli bir bildirim ID gereklidir'
        });
        return;
      }
      
      const result = await this.notificationService.deleteNotification(Number(id));
      
      res.status(200).json({
        status: 'success',
        message: 'Bildirim başarıyla silindi',
        data: result
      });
    } catch (error: any) {
      logger.error('Bildirim silinirken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Bildirim silinirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Manuel test için bildirim oluşturur (sadece geliştirme amaçlı)
   * @route POST /api/notifications/test
   */
  public createTestNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      // Test bildirimi için istek gövdesinden kullanıcı ID'sini alabiliriz veya
      // otomatik olarak token'dan gelen ID'yi kullanabiliriz
      const { user_id, notification_type, content, event_id, link } = req.body;
      
      // Bildirim tipi ve içerik kontrolü
      if (!notification_type || !content) {
        res.status(400).json({
          status: 'error',
          message: 'Bildirim tipi ve içerik gereklidir'
        });
        return;
      }
      
      // Kullanıcı ID ya istek gövdesinden ya da token'dan alınır
      const userId = user_id || req.userProfile?.id;
      
      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'Kullanıcı ID gereklidir'
        });
        return;
      }
      
      // Bildirim tipini doğrula
      if (!Object.values(NotificationType).includes(notification_type as NotificationType)) {
        res.status(400).json({
          status: 'error',
          message: `Geçersiz bildirim tipi. Geçerli tipler: ${Object.values(NotificationType).join(', ')}`
        });
        return;
      }
      
      const notification = await this.notificationService.createNotification({
        notification_type: notification_type as NotificationType,
        content,
        user_id: userId,
        event_id: event_id ? Number(event_id) : undefined,
        link
      });
      
      res.status(201).json({
        status: 'success',
        message: 'Test bildirimi başarıyla oluşturuldu',
        data: notification
      });
    } catch (error: any) {
      logger.error('Test bildirimi oluşturulurken hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Test bildirimi oluşturulurken bir hata oluştu'
      });
    }
  };
} 