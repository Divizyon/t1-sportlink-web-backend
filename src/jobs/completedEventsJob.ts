import { markExpiredEventsAsCompleted } from '../services/eventService';
import logger from '../utils/logger';
import { CronJob } from 'cron';

// Her saat başı çalışacak job
export const scheduleCompletedEventsJob = (): CronJob => {
  const job = new CronJob(
    '0 * * * *', // Her saatin başında (0. dakikada)
    async () => {
      try {
        logger.info('Checking for expired events...');
        await markExpiredEventsAsCompleted();
        logger.info('Expired events marked as completed successfully.');
      } catch (error) {
        logger.error(`Error marking expired events as completed: ${JSON.stringify(error)}`);
      }
    },
    null, // onComplete
    true, // start
    'Europe/Istanbul' // timezone
  );

  return job;
}; 