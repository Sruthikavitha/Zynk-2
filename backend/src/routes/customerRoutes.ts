import { Router } from 'express';
import CustomerController from '../controllers/customerController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate8PMCutoff } from '../middleware/cutoffMiddleware';

const router = Router();

// Protect all customer endpoints with authentication and CUSTOMER role check
router.use(authenticate);

router.get('/dashboard', CustomerController.getDashboard);
router.get('/plans', CustomerController.getPlans);
router.get('/subscriptions', CustomerController.getSubscriptions);
router.get('/meals', CustomerController.getMeals);
router.get('/history', CustomerController.getHistory);
router.get('/addresses', CustomerController.getAddresses);
router.post('/addresses', CustomerController.createAddress);
router.put('/addresses/:id', CustomerController.updateAddress);

// 8 PM Cutoff Enforced Meal Actions
router.post('/meals/:id/skip', validate8PMCutoff, CustomerController.skipMeal);
router.post('/meals/:id/swap', validate8PMCutoff, CustomerController.swapMeal);
router.post('/meals/:id/address', validate8PMCutoff, CustomerController.changeMealAddress);

export default router;
