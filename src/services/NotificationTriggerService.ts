import { NotificationService } from './NotificationService';
import { NotificationType } from '../types/Notification';
import logger from '../utils/logger';

/**
 * NotificationTriggerService
 * Sistemde gerçekleşen olaylara cevap olarak bildirim oluşturur.
 * Diğer servisler tarafından çağrılır.
 */
export class NotificationTriggerService {
  private notificationService: NotificationService;
  
  constructor() {
    this.notificationService = new NotificationService();
  }
  
  /**
   * Yeni etkinlik oluşturulduğunda bildirim oluşturur
   * @param eventId Etkinlik ID
   * @param eventTitle Etkinlik başlığı
   * @param userId Etkinliği oluşturan kullanıcı ID
   * @param adminIds Bildirim gönderilecek admin ID'leri
   */
  public async onEventCreated(eventId: number, eventTitle: string, userId: string, adminIds: string[]): Promise<void> {
    try {
      logger.info(`Yeni etkinlik bildirimi oluşturuluyor: ${eventTitle}`);
      
      const content = `Yeni etkinlik oluşturuldu: ${eventTitle}`;
      const link = `/admin/events/${eventId}`;
      
      // Admins ve moderatörlere bildirim gönder
      await this.notificationService.createEventNotification(
        NotificationType.NEW_EVENT,
        content,
        eventId,
        adminIds,
        link
      );
      
      logger.info(`Etkinlik bildirimi oluşturuldu: ${eventTitle}`);
    } catch (error: any) {
      logger.error('Etkinlik bildirimi oluşturma hatası:', error);
    }
  }
  
  /**
   * Kullanıcı izlemeye alındığında bildirim oluşturur
   * @param userId İzlemeye alınan kullanıcı ID
   * @param userEmail Kullanıcı e-posta
   * @param adminIds Bildirim gönderilecek admin ID'leri
   */
  public async onUserWatched(userId: string, userEmail: string, adminIds: string[]): Promise<void> {
    try {
      logger.info(`Kullanıcı izleme bildirimi oluşturuluyor: ${userEmail}`);
      
      const content = `Kullanıcı izlemeye alındı: ${userEmail}`;
      const link = `/admin/users/${userId}`;
      
      // Admins ve moderatörlere bildirim gönder
      await this.notificationService.createEventNotification(
        NotificationType.USER_WATCHED,
        content,
        0, // Etkinlik ID yok
        adminIds,
        link
      );
      
      logger.info(`Kullanıcı izleme bildirimi oluşturuldu: ${userEmail}`);
    } catch (error: any) {
      logger.error('Kullanıcı izleme bildirimi oluşturma hatası:', error);
    }
  }
  
  /**
   * Kullanıcı inaktif yapıldığında bildirim oluşturur
   * @param userId İnaktif yapılan kullanıcı ID
   * @param userEmail Kullanıcı e-posta
   * @param adminIds Bildirim gönderilecek admin ID'leri
   */
  public async onUserInactivated(userId: string, userEmail: string, adminIds: string[]): Promise<void> {
    try {
      logger.info(`Kullanıcı inaktif bildirimi oluşturuluyor: ${userEmail}`);
      
      const content = `Kullanıcı inaktif yapıldı: ${userEmail}`;
      const link = `/admin/users/${userId}`;
      
      // Admins ve moderatörlere bildirim gönder
      await this.notificationService.createEventNotification(
        NotificationType.USER_INACTIVE,
        content,
        0, // Etkinlik ID yok
        adminIds,
        link
      );
      
      logger.info(`Kullanıcı inaktif bildirimi oluşturuldu: ${userEmail}`);
    } catch (error: any) {
      logger.error('Kullanıcı inaktif bildirimi oluşturma hatası:', error);
    }
  }
  
  /**
   * Yeni rapor oluşturulduğunda bildirim oluşturur
   * @param reportId Rapor ID
   * @param reportTitle Rapor başlığı
   * @param adminIds Bildirim gönderilecek admin ID'leri
   */
  public async onReportCreated(reportId: number, reportTitle: string, adminIds: string[]): Promise<void> {
    try {
      logger.info(`Yeni rapor bildirimi oluşturuluyor: ${reportTitle}`);
      
      const content = `Yeni rapor oluşturuldu: ${reportTitle}`;
      const link = `/admin/reports/${reportId}`;
      
      // Admins ve moderatörlere bildirim gönder
      await this.notificationService.createEventNotification(
        NotificationType.NEW_REPORT,
        content,
        0, // Etkinlik ID yok
        adminIds,
        link
      );
      
      logger.info(`Rapor bildirimi oluşturuldu: ${reportTitle}`);
    } catch (error: any) {
      logger.error('Rapor bildirimi oluşturma hatası:', error);
    }
  }
  
  /**
   * Haber onaylandığında bildirim oluşturur
   * @param newsId Haber ID
   * @param newsTitle Haber başlığı
   * @param adminIds Bildirim gönderilecek admin ID'leri
   */
  public async onNewsApproved(newsId: number, newsTitle: string, adminIds: string[]): Promise<void> {
    try {
      logger.info(`Haber onay bildirimi oluşturuluyor: ${newsTitle}`);
      
      const content = `Haber onaylandı: ${newsTitle}`;
      const link = `/admin/news/${newsId}`;
      
      // Admins ve moderatörlere bildirim gönder
      await this.notificationService.createEventNotification(
        NotificationType.NEWS_APPROVED,
        content,
        0, // Etkinlik ID yok
        adminIds,
        link
      );
      
      logger.info(`Haber onay bildirimi oluşturuldu: ${newsTitle}`);
    } catch (error: any) {
      logger.error('Haber onay bildirimi oluşturma hatası:', error);
    }
  }
} 