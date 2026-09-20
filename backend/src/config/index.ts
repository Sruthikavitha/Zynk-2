import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'zynk_super_secret_jwt_key_2026_flexible_food_subscription',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_zynk_key_12345',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'zynk_razorpay_secret_67890',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  defaultCutoffTime: process.env.DEFAULT_CUTOFF_TIME || '20:00', // 8:00 PM
};

export default config;
