import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import config from './config';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import chefRoutes from './routes/chefRoutes';
import adminRoutes from './routes/adminRoutes';
import paymentRoutes from './routes/paymentRoutes';
import systemRoutes from './routes/systemRoutes';
import deliveryRoutes from './routes/deliveryRoutes';

import { initializeDailyReportCron } from './jobs/dailyReportJob';
import { createServer } from 'http';
import { initializeDeliverySocket } from './socket/deliverySocket';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'ZYNK Flexible Food Subscription API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cutoffTime: config.defaultCutoffTime,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server & Initialize Jobs
const PORT = config.port;
const httpServer = createServer(app);
initializeDeliverySocket(httpServer);
httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ZYNK Backend API running on http://localhost:${PORT}`);
  console.log(`🕒 Daily 8 PM Cutoff Logic Active (${config.defaultCutoffTime})`);
  console.log(`=======================================================`);
  initializeDailyReportCron();
});

export default app;
