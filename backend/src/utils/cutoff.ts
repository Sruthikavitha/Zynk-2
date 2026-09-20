import config from '../config';

export interface CutoffCheckResult {
  allowed: boolean;
  message: string;
  cutoffTime: string;
  isLocked: boolean;
  timeRemaining: string;
}

export const check8PMCutoff = (deliveryDate: Date, cutoffTimeStr: string = config.defaultCutoffTime): CutoffCheckResult => {
  const now = new Date();
  
  // Extract target hour and minute from cutoff config (e.g. "20:00")
  const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(':').map(Number);
  
  // Standardize deliveryDate to start of day
  const targetDate = new Date(deliveryDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deliveryStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  // Cutoff timestamp for the target delivery date is 8:00 PM on the DAY BEFORE delivery (or same day cutoff if configured for same day delivery)
  // Standard ZYNK business logic: Changes for tomorrow's meals close at 8:00 PM today.
  // Changes for today's meals are already locked past today's 8:00 PM.
  
  // Calculate cutoff date: for a meal on deliveryDate, cutoff is 8 PM on (deliveryDate - 1 day)
  const cutoffDate = new Date(deliveryStartOfDay);
  cutoffDate.setDate(cutoffDate.getDate() - 1);
  cutoffDate.setHours(cutoffHour, cutoffMinute, 0, 0);

  // If delivery is for TODAY, check if current time is past today's 8:00 PM or yesterday's cutoff
  // For maximum flexibility in testing: if deliveryDate is today and current time < today's 8 PM, allow modification.
  const todayCutoff = new Date(today);
  todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

  let isLocked = false;

  if (deliveryStartOfDay.getTime() <= today.getTime()) {
    // Delivery is today or past
    if (now.getTime() >= todayCutoff.getTime()) {
      isLocked = true;
    }
  } else {
    // Delivery is tomorrow or future
    if (now.getTime() >= cutoffDate.getTime()) {
      isLocked = true;
    }
  }

  // Calculate remaining time until cutoff
  const activeCutoffDate = (deliveryStartOfDay.getTime() <= today.getTime()) ? todayCutoff : cutoffDate;
  const diffMs = activeCutoffDate.getTime() - now.getTime();

  let timeRemaining = 'Locked';
  if (diffMs > 0) {
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    timeRemaining = hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
  }

  if (isLocked) {
    return {
      allowed: false,
      message: 'Meal changes are locked after 8:00 PM.',
      cutoffTime: `${cutoffTimeStr} (8:00 PM)`,
      isLocked: true,
      timeRemaining: '🔒 Changes locked',
    };
  }

  return {
    allowed: true,
    message: `Changes available until 8:00 PM (${timeRemaining})`,
    cutoffTime: `${cutoffTimeStr} (8:00 PM)`,
    isLocked: false,
    timeRemaining: `🟢 ${timeRemaining}`,
  };
};
