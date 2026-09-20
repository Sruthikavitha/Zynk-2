import { Router } from 'express';
import SystemController from '../controllers/systemController';

const router = Router();

router.get('/cutoff-status', SystemController.getCutoffStatus);

export default router;
