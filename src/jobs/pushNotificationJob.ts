import { CronJob } from 'cron';
import { PushNotificationService } from '../services/PushNotificationService';
import logger from '../utils/logger';

// Her 1 dakikada bir çalışacak cron job
export const schedulePushNotificationsJob = () => {
  const pushNotificationService = new PushNotificationService();
  
  const job = new CronJob('*/1 * * * *', async () => {
    logger.info('Push notification job başlatılıyor...');
    
    try {
      const result = await pushNotificationService.sendPendingNotifications();
      logger.info(`Push notification job tamamlandı: ${result.success} başarılı, ${result.failed} başarısız bildirim`);
    } catch (error) {
      logger.error('Push notification job hatası:', error);
    }
  });
  
  job.start();
  logger.info('Push notification job zamanlandı');
};
