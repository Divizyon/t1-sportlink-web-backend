import { markExpiredEventsAsCompleted, autoRejectPendingEvents } from '../services/eventService';
import logger from '../utils/logger';
import { CronJob } from 'cron';

// Her saat başı çalışacak job - süresi dolmuş etkinlikleri tamamlandı olarak işaretler
export const scheduleCompletedEventsJob = (): CronJob => {
  const job = new CronJob(
    '0 * * * *', // Her saatin başında (0. dakikada)
    async () => {
      try {
        logger.info('Checking for expired events...');
        await markExpiredEventsAsCompleted();
        logger.info('Expired events marked as completed successfully.');
      } catch (error) {
        logger.error('Error marking expired events as completed:', error);
      }
    },
    null, // onComplete
    true, // start
    'Europe/Istanbul' // timezone
  );

  return job;
};

// Her 5 dakikada bir çalışacak job - başlamasına 30 dakika kalan onay bekleyen etkinlikleri reddeder
export const scheduleAutoRejectEventsJob = (): CronJob => {
  const job = new CronJob(
    '*/5 * * * *', // Her 5 dakikada bir
    async () => {
      try {
        logger.info('Başlangıç zamanına 30 dakika kalan onay bekleyen etkinlikler kontrol ediliyor...');
        await autoRejectPendingEvents();
        logger.info('Otomatik ret işlemi tamamlandı.');
      } catch (error) {
        logger.error('Etkinlikleri otomatik reddetme hatası:', error);
      }
    },
    null, // onComplete
    true, // start
    'Europe/Istanbul' // timezone
  );

  return job;
}; 