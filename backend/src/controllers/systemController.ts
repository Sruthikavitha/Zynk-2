import { Request, Response } from 'express';
import CutoffService from '../services/cutoffService';

export class SystemController {
  public static getCutoffStatus(req: Request, res: Response) {
    try {
      const targetDate = req.query.date as string | undefined;
      const status = CutoffService.getSystemCutoffStatus(targetDate);
      return res.status(200).json({ success: true, status });
    } catch (error) {
      console.error('Error fetching cutoff status:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch cutoff status.' });
    }
  }
}

export default SystemController;
