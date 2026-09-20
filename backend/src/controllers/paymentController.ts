import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import PaymentService from '../services/paymentService';

export class PaymentController {
  public static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ success: false, error: 'Subscription Plan ID is required.' });
      }

      const orderData = await PaymentService.createOrder(userId, planId);

      return res.status(200).json({
        success: true,
        ...orderData,
      });
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to create payment order.' });
    }
  }

  public static async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { planId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!planId || !razorpayOrderId || !razorpayPaymentId) {
        return res.status(400).json({
          success: false,
          error: 'Plan ID, Razorpay Order ID, and Payment ID are required.',
        });
      }

      const verificationResult = await PaymentService.verifyPayment({
        userId,
        planId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      return res.status(200).json(verificationResult);
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      return res.status(400).json({ success: false, error: error.message || 'Payment verification failed.' });
    }
  }
}

export default PaymentController;
