import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { broadcastDeliveryLocation } from '../socket/deliverySocket';

const deliveryInclude = {
  order: {
    include: {
      meal: true,
      chef: true,
      deliveryAddress: true,
      user: { select: { id: true, name: true, phone: true } },
    },
  },
  deliveryPartner: { include: { user: { select: { id: true, name: true, phone: true } } } },
} as const;

const canAccess = (delivery: any, req: AuthenticatedRequest) => {
  const userId = req.user!.userId;
  return req.user!.role === 'ADMIN' || delivery.order.userId === userId || delivery.deliveryPartner?.userId === userId;
};

const withRoute = async (delivery: any) => {
  const points = [
    [delivery.pickupLongitude, delivery.pickupLatitude],
    [delivery.currentLongitude, delivery.currentLatitude],
    [delivery.deliveryLongitude, delivery.deliveryLatitude],
  ].filter(([longitude, latitude]) => longitude != null && latitude != null);

  if (points.length < 2) return { coordinates: [], distanceMeters: null, durationSeconds: null };
  try {
    const coordinates = points.map(([longitude, latitude]) => `${longitude},${latitude}`).join(';');
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
    if (!response.ok) return { coordinates: [], distanceMeters: null, durationSeconds: null };
    const result = await response.json() as { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: number[][] } }> };
    const route = result.routes?.[0];
    return {
      coordinates: route?.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]) || [],
      distanceMeters: route?.distance ?? null,
      durationSeconds: route?.duration ?? null,
    };
  } catch {
    return { coordinates: [], distanceMeters: null, durationSeconds: null };
  }
};

export class DeliveryController {
  public static async getTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id }, include: deliveryInclude });
      if (!delivery || !canAccess(delivery, req)) return res.status(404).json({ success: false, error: 'Delivery not found.' });

      const isCustomer = req.user!.role === 'CUSTOMER';
      const partner = delivery.deliveryPartner;
      const route = await withRoute(delivery);
      return res.status(200).json({
        success: true,
        delivery: {
          ...delivery,
          deliveryPartner: isCustomer && partner ? {
            id: partner.id,
            user: partner.user,
            vehicleType: partner.vehicleType,
          } : partner,
          route,
        },
      });
    } catch (error) {
      console.error('Error fetching delivery tracking:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch delivery tracking.' });
    }
  }

  public static async getAssigned(req: AuthenticatedRequest, res: Response) {
    try {
      const where = req.user!.role === 'ADMIN' ? {} : { deliveryPartner: { userId: req.user!.userId } };
      const deliveries = await prisma.delivery.findMany({ where, include: deliveryInclude, orderBy: { createdAt: 'desc' } });
      return res.status(200).json({ success: true, deliveries });
    } catch (error) {
      console.error('Error fetching assigned deliveries:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch assigned deliveries.' });
    }
  }

  public static async updateLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required.' });
      }

      const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id }, include: { deliveryPartner: true } });
      if (!delivery || delivery.deliveryPartner?.userId !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Only the assigned delivery partner can update this location.' });
      }
      if (delivery.status !== 'OUT_FOR_DELIVERY') {
        return res.status(409).json({ success: false, error: 'Location updates are only accepted while out for delivery.' });
      }

      const now = new Date();
      await prisma.$transaction([
        prisma.delivery.update({ where: { id: delivery.id }, data: { currentLatitude: latitude, currentLongitude: longitude, lastLocationUpdate: now } }),
        prisma.deliveryPartner.update({ where: { id: delivery.deliveryPartnerId! }, data: { currentLatitude: latitude, currentLongitude: longitude, lastLocationUpdate: now } }),
        prisma.deliveryLocation.create({ data: { deliveryId: delivery.id, deliveryPartnerId: delivery.deliveryPartnerId!, latitude, longitude } }),
      ]);

      const payload = { deliveryId: delivery.id, latitude, longitude, lastLocationUpdate: now.toISOString() };
      broadcastDeliveryLocation(delivery.id, payload);
      return res.status(200).json({ success: true, location: payload });
    } catch (error) {
      console.error('Error updating delivery location:', error);
      return res.status(500).json({ success: false, error: 'Failed to update delivery location.' });
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const status = String(req.body.status || '').toUpperCase();
      const allowed = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!allowed.includes(status)) return res.status(400).json({ success: false, error: 'Invalid delivery status.' });

      const existing = await prisma.delivery.findUnique({ where: { id: req.params.id }, include: { deliveryPartner: true, order: { select: { userId: true } } } });
      if (!existing || (req.user!.role !== 'ADMIN' && existing.deliveryPartner?.userId !== req.user!.userId)) {
        return res.status(403).json({ success: false, error: 'You are not authorized to update this delivery.' });
      }

      const delivery = await prisma.delivery.update({
        where: { id: existing.id },
        data: {
          status: status as any,
          pickupTime: status === 'PICKED_UP' ? new Date() : existing.pickupTime,
          deliveryTime: status === 'DELIVERED' ? new Date() : existing.deliveryTime,
          order: { update: { status: status === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : status === 'DELIVERED' ? 'DELIVERED' : status === 'PICKED_UP' ? 'PREPARED' : 'CONFIRMED' } },
        },
        include: deliveryInclude,
      });

      if (status === 'OUT_FOR_DELIVERY') {
        await prisma.notification.create({
          data: {
            userId: existing.order.userId,
            title: 'Your ZYNK meal is out for delivery',
            message: `Your meal is on the way. Track delivery at /customer/delivery/${delivery.id}`,
          },
        });
      }

      return res.status(200).json({ success: true, delivery });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return res.status(500).json({ success: false, error: 'Failed to update delivery status.' });
    }
  }

  public static async assignPartner(req: AuthenticatedRequest, res: Response) {
    try {
      const deliveryPartnerId = String(req.body.deliveryPartnerId || '');
      if (!deliveryPartnerId) return res.status(400).json({ success: false, error: 'Delivery partner is required.' });
      const delivery = await prisma.delivery.update({
        where: { id: req.params.id },
        data: { deliveryPartnerId },
        include: deliveryInclude,
      });
      return res.status(200).json({ success: true, delivery });
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      return res.status(500).json({ success: false, error: 'Failed to assign delivery partner.' });
    }
  }
}

export default DeliveryController;