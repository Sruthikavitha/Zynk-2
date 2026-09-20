import cron from 'node-cron';
import DailyReportService from '../services/dailyReportService';

export const initializeDailyReportCron = () => {
  // Schedule task to run at 8:00 PM (20:00) every day
  cron.schedule('0 20 * * *', async () => {
    console.log('[CRON] Executing 8 PM Daily Meal Aggregation & Report Generation job...');
    try {
      await DailyReportService.generateDailyReport();
      console.log('[CRON] 8 PM Daily Report Generation completed successfully.');
    } catch (error) {
      console.error('[CRON ERROR] Failed to run 8 PM Daily Report cron job:', error);
    }
  });

  console.log('[JOBS] 8 PM Daily Report Cron Job initialized (Schedule: 0 20 * * *).');
};

export default initializeDailyReportCron;
