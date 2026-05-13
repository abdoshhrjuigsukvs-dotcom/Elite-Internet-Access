import cron from "node-cron";
import { logger } from "./logger";

type SendDailyFn = () => Promise<{ sent: number; total: number }>;

let initialized = false;

export function initScheduler(sendDailyReminder: SendDailyFn) {
  if (initialized) return;
  initialized = true;

  // 9:00 AM Cairo time = 07:00 UTC (Egypt is UTC+2 year-round since 2011)
  const CAIRO_9AM_UTC = "0 7 * * *";

  cron.schedule(
    CAIRO_9AM_UTC,
    async () => {
      logger.info("Scheduled daily reminder: starting send");
      try {
        const result = await sendDailyReminder();
        logger.info(
          { sent: result.sent, total: result.total },
          "Scheduled daily reminder: completed"
        );
      } catch (err) {
        logger.error({ err }, "Scheduled daily reminder: failed");
      }
    },
    { timezone: "UTC" }
  );

  logger.info(
    { schedule: CAIRO_9AM_UTC, equivalent: "09:00 Africa/Cairo (UTC+2)" },
    "Daily reminder scheduler started"
  );
}
