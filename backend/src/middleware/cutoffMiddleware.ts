import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import prisma from '../config/prisma';
import { check8PMCutoff } from '../utils/cutoff';

export const validate8PMCutoff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mealIdOrOrderId = req.params.id || req.body.orderId;

    if (!mealIdOrOrderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required for cutoff verification.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: mealIdOrOrderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Target order/meal not found.' });
    }

    // Check cutoff for order's deliveryDate
    const cutoffStatus = check8PMCutoff(order.deliveryDate);

    if (!cutoffStatus.allowed) {
      return res.status(400).json({
        success: false,
        error: 'Meal changes are locked after 8:00 PM.',
        code: 'CUTOFF_LOCKED',
        cutoffStatus,
      });
    }

    // Attach order to request for downstream controller use
    (req as any).targetOrder = order;
    next();
  } catch (error) {
    console.error('Error in 8 PM Cutoff Middleware:', error);
    return res.status(500).json({ success: false, error: 'Failed to process 8 PM cutoff verification.' });
  }
};
