import api from './api';
import { RazorpayOrderResponse, RazorpaySuccessResponse, RazorpayOptions, User } from '../types';

/**
 * Dynamically loads the Razorpay checkout.js script if not already loaded globally.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Creates a payment order on the backend for a real SubscriptionPlan.
 */
export const createPaymentOrder = async (planId: string): Promise<RazorpayOrderResponse> => {
  if (!planId) {
    throw new Error('A valid Subscription Plan ID is required.');
  }
  const response = await api.post('/payments/create-order', { planId });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create payment order.');
  }
  return response.data;
};

/**
 * Verifies payment signature server-side and activates the subscription.
 */
export const verifyPaymentSignature = async (payload: {
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const response = await api.post('/payments/verify', payload);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Payment verification failed.');
  }
  return response.data;
};

export interface CheckoutHandlerParams {
  orderData: RazorpayOrderResponse;
  user: User | null;
  kitchenName?: string;
  onSuccess: (paymentResult: any) => void;
  onDismiss: () => void;
  onError: (error: Error) => void;
}

/**
 * Opens the real Razorpay Checkout modal with prefilled user details.
 */
export const openRazorpayCheckout = async (params: CheckoutHandlerParams): Promise<void> => {
  const { orderData, user, kitchenName, onSuccess, onDismiss, onError } = params;

  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded || !window.Razorpay) {
    throw new Error('Razorpay Checkout SDK failed to load. Please check your network connection.');
  }

  let isPaymentCompleted = false;

  const options: RazorpayOptions = {
    key: orderData.keyId,
    amount: orderData.amountInPaise,
    currency: orderData.currency || 'INR',
    name: kitchenName || 'ZYNK Food Subscription',
    description: `${orderData.plan?.name || 'Meal'} Subscription (${orderData.plan?.durationDays || 7} Days)`,
    order_id: orderData.razorpayOrderId,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: {
      color: '#6366F1', // ZYNK indigo/purple brand accent
    },
    handler: async (response: RazorpaySuccessResponse) => {
      isPaymentCompleted = true;
      try {
        const verificationResult = await verifyPaymentSignature({
          planId: orderData.plan.id,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        onSuccess(verificationResult);
      } catch (err: any) {
        onError(err instanceof Error ? err : new Error(err.message || 'Payment signature verification failed.'));
      }
    },
    modal: {
      ondismiss: () => {
        if (!isPaymentCompleted) {
          onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', (failedResponse: any) => {
    const errorMsg =
      failedResponse?.error?.description ||
      failedResponse?.error?.reason ||
      'Payment was not completed. Please try again.';
    onError(new Error(errorMsg));
  });

  razorpay.open();
};
