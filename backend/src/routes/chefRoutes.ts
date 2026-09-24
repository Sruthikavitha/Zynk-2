import { Router } from 'express';
import ChefController from '../controllers/chefController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Registration & status available for signed in users applying as chef
router.post('/register', ChefController.registerChef);
router.get('/application', ChefController.getApplicationStatus);

// Approved chef protected routes
router.use(requireRole('CHEF', 'ADMIN'));
router.get('/dashboard', ChefController.getDashboard);
router.put('/profile', ChefController.updateProfile);
router.get('/orders', ChefController.getOrders);
router.put('/orders/:id/status', ChefController.updateOrderStatus);
router.get('/reports', ChefController.getReports);
router.get('/menu', ChefController.getMenu);
router.post('/menu', ChefController.createMenuItem);
router.put('/menu/:id', ChefController.updateMenuItem);
router.delete('/menu/:id', ChefController.deleteMenuItem);

export default router;
