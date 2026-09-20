import { Router } from 'express';
import AdminController from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.put('/users/:id/toggle-status', AdminController.toggleUserStatus);
router.get('/chefs', AdminController.getChefs);
router.post('/chefs/:id/approve', AdminController.approveChef);
router.post('/chefs/:id/reject', AdminController.rejectChef);
router.get('/subscriptions', AdminController.getSubscriptions);
router.get('/orders', AdminController.getOrders);
router.get('/reports', AdminController.getReports);
router.post('/reports/trigger-daily', AdminController.triggerDailyReport);

export default router;
