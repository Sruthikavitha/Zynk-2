import { Router } from 'express';
import PaymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/create-order', PaymentController.createOrder);
router.post('/verify', PaymentController.verifyPayment);

export default router;
