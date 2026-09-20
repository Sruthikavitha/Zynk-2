import { check8PMCutoff, CutoffCheckResult } from '../utils/cutoff';
import config from '../config';

export class CutoffService {
  public static getSystemCutoffStatus(targetDate?: string | Date): CutoffCheckResult {
    const dateToVerify = targetDate ? new Date(targetDate) : new Date();
    return check8PMCutoff(dateToVerify, config.defaultCutoffTime);
  }
}

export default CutoffService;
