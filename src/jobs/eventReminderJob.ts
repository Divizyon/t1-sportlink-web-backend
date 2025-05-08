import { CronJob } from 'cron';
import { supabaseAdmin } from '../config/supabase';
import { PushNotificationService } from '../services/PushNotificationService';
import logger from '../utils/logger';

export const scheduleEventReminderJob = () => {
  const job = new CronJob('*/15 * * * *', async () => {
    logger.info('Etkinlik hatırlatma job\'ı çalışıyor...');
    
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      const { data: upcomingEvents, error } = await supabaseAdmin
        .from('events')
        .select('id')
        .gte('date', now.toISOString())
        .lte('date', oneHourLater.toISOString())
        .eq('status', 'active');
        
      if (error) {
        logger.error('Etkinlikleri getirme hatası:', error);
        return;
      }
      
      if (!upcomingEvents || upcomingEvents.length === 0) {
        logger.info('Yaklaşan etkinlik bulunamadı');
        return;
      }
      
      logger.info(`${upcomingEvents.length} yaklaşan etkinlik bulundu, hatırlatıcılar gönderiliyor...`);
      
      const pushNotificationService = new PushNotificationService();
      
      for (const event of upcomingEvents) {
        await pushNotificationService.sendEventReminderNotification(event.id);
      }
      
      logger.info('Etkinlik hatırlatıcıları gönderildi');
    } catch (error) {
      logger.error('Etkinlik hatırlatma job hatası:', error);
    }
  });
  
  job.start();
  logger.info('Etkinlik hatırlatma job\'ı zamanlandı');
};
