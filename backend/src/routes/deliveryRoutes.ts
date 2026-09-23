import { Router } from 'express';
import DeliveryController from '../controllers/deliveryController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', requireRole('DELIVERY_PARTNER', 'ADMIN'), DeliveryController.getAssigned);
router.get('/:id', DeliveryController.getTracking);
router.patch('/:id/assign', requireRole('ADMIN'), DeliveryController.assignPartner);
router.patch('/:id/location', requireRole('DELIVERY_PARTNER'), DeliveryController.updateLocation);
router.patch('/:id/status', requireRole('DELIVERY_PARTNER', 'ADMIN'), DeliveryController.updateStatus);

export default router;