import { Server } from 'socket.io';
import prisma from '../config/prisma';
import config from '../config';
import { verifyToken } from '../utils/jwt';

let io: Server;

export const deliveryRoom = (deliveryId: string) => `delivery:${deliveryId}`;

export const initializeDeliverySocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required.'));
      socket.data.user = verifyToken(token);
      return next();
    } catch {
      return next(new Error('Invalid authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-delivery', async (deliveryId: string, callback?: (result: { success: boolean; error?: string }) => void) => {
      const user = socket.data.user;
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { order: { select: { userId: true } }, deliveryPartner: { select: { userId: true } } },
      });

      const authorized = delivery && (
        user.role === 'ADMIN' ||
        delivery.order.userId === user.userId ||
        delivery.deliveryPartner?.userId === user.userId
      );

      if (!authorized) {
        callback?.({ success: false, error: 'You are not authorized to view this delivery.' });
        return;
      }

      socket.join(deliveryRoom(deliveryId));
      callback?.({ success: true });
    });
  });

  return io;
};

export const broadcastDeliveryLocation = (deliveryId: string, payload: object) => {
  io?.to(deliveryRoom(deliveryId)).emit('delivery-location', payload);
};