import {
  markExpiredEventsAsCompleted,
  markExpiredPendingEvents,
} from "../services/eventService";
import logger from "../utils/logger";
import { CronJob } from "cron";

// Run every 1 minute to check for expired events
export const scheduleCompletedEventsJob = (): CronJob => {
  const job = new CronJob(
    "* * * * *", // Run every minute
    async () => {
      try {
        logger.info("Checking for expired events...");

        // Mark active events that have ended as completed
        await markExpiredEventsAsCompleted();
        logger.info("Expired events marked as completed successfully.");

        // Mark pending events that have passed their start time as rejected
        await markExpiredPendingEvents();
        logger.info("Expired pending events marked as rejected successfully.");
      } catch (error) {
        logger.error("Error processing expired events:", error);
      }
    },
    null, // onComplete
    true, // start
    "Europe/Istanbul" // timezone
  );

  // Also run immediately when the server starts
  (async () => {
    try {
      logger.info(
        "Running initial check for expired events on server start..."
      );

      await markExpiredEventsAsCompleted();
      logger.info(
        "Initial check: Expired events marked as completed successfully"
      );

      await markExpiredPendingEvents();
      logger.info(
        "Initial check: Expired pending events marked as rejected successfully"
      );
    } catch (error) {
      logger.error("Error during initial expired events check:", error);
    }
  })();

  return job;
};
