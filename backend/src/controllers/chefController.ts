import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import geocodingService from '../services/geocodingService';

export class ChefController {
  public static async registerChef(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        kitchenName,
        kitchenType,
        location,
        fssaiNumber,
        description,
        address,
        city,
        area,
        district,
        deliveryRadiusKm,
        latitude,
        longitude,
      } = req.body;

      if (!kitchenName || !kitchenType || !location) {
        return res.status(400).json({ success: false, error: 'Kitchen name, type, and location are required.' });
      }

      const existingProfile = await prisma.chef.findUnique({ where: { userId } });
      if (existingProfile) {
        return res.status(400).json({ success: false, error: 'Chef application already submitted.' });
      }

      let lat = latitude != null && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null;
      let lng = longitude != null && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

      // Geocode kitchen location if not provided
      if (lat == null || lng == null) {
        const query = [address || area, city || location, district || 'Coimbatore', 'Tamil Nadu'].filter(Boolean).join(', ');
        const coords = await geocodingService.geocodeLocationString(query) || await geocodingService.geocodeLocationString(location);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: 'CHEF' },
      });

      const radius = deliveryRadiusKm != null && !isNaN(parseFloat(deliveryRadiusKm)) ? parseFloat(deliveryRadiusKm) : 5.0;

      const chef = await prisma.chef.create({
        data: {
          userId,
          kitchenName,
          kitchenType,
          location,
          address: address || null,
          city: city || location,
          area: area || null,
          district: district || 'Coimbatore',
          fssaiNumber,
          description,
          latitude: lat,
          longitude: lng,
          deliveryRadiusKm: radius,
          approvalStatus: 'PENDING',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Your chef application has been submitted and is pending admin approval.',
        chef,
      });
    } catch (error) {
      console.error('Error in chef registration:', error);
      return res.status(500).json({ success: false, error: 'Failed to submit chef application.' });
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });
      if (!chef) {
        return res.status(404).json({ success: false, error: 'Chef profile not found.' });
      }

      const {
        kitchenName,
        kitchenType,
        location,
        address,
        city,
        area,
        district,
        deliveryRadiusKm,
        cuisine,
        description,
        serviceAreas,
        latitude,
        longitude,
      } = req.body;

      let lat = latitude != null && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : chef.latitude;
      let lng = longitude != null && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : chef.longitude;

      // Geocode if location fields changed and new coordinates were not manually passed
      const locChanged = (address && address !== chef.address) || (area && area !== chef.area) || (city && city !== chef.city) || (location && location !== chef.location);
      if (locChanged && (latitude == null || longitude == null)) {
        const query = [address || area, city || location || chef.city, district || chef.district, 'Tamil Nadu'].filter(Boolean).join(', ');
        const coords = await geocodingService.geocodeLocationString(query) || await geocodingService.geocodeLocationString(location || chef.location);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      const updatedChef = await prisma.chef.update({
        where: { id: chef.id },
        data: {
          kitchenName: kitchenName || chef.kitchenName,
          kitchenType: kitchenType || chef.kitchenType,
          location: location || chef.location,
          address: address !== undefined ? address : chef.address,
          city: city || chef.city,
          area: area !== undefined ? area : chef.area,
          district: district || chef.district,
          cuisine: cuisine !== undefined ? cuisine : chef.cuisine,
          description: description !== undefined ? description : chef.description,
          serviceAreas: serviceAreas !== undefined ? (typeof serviceAreas === 'string' ? serviceAreas : JSON.stringify(serviceAreas)) : chef.serviceAreas,
          deliveryRadiusKm: deliveryRadiusKm != null && !isNaN(parseFloat(deliveryRadiusKm)) ? parseFloat(deliveryRadiusKm) : chef.deliveryRadiusKm,
          latitude: lat,
          longitude: lng,
        },
      });

      return res.status(200).json({ success: true, message: 'Chef profile updated successfully.', chef: updatedChef });
    } catch (error) {
      console.error('Error updating chef profile:', error);
      return res.status(500).json({ success: false, error: 'Failed to update chef profile.' });
    }
  }

  public static async getApplicationStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef) {
        return res.status(404).json({ success: false, error: 'No chef profile found.' });
      }

      return res.status(200).json({
        success: true,
        status: chef.approvalStatus,
        chef,
      });
    } catch (error) {
      console.error('Error fetching chef application status:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch application status.' });
    }
  }

  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef) {
        return res.status(404).json({ success: false, error: 'Chef profile not found.' });
      }

      if (chef.approvalStatus !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          error: 'Your chef application is still under review or rejected.',
          approvalStatus: chef.approvalStatus,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayOrders = await prisma.order.findMany({
        where: {
          chefId: chef.id,
          deliveryDate: { gte: today, lt: tomorrow },
          status: { notIn: ['SKIPPED', 'CANCELLED'] },
        },
        include: {
          deliveryAddress: true,
          meal: true,
          user: { select: { name: true, phone: true } },
        },
      });

      const breakfastCount = todayOrders.filter((o: any) => o.mealType === 'BREAKFAST').length;
      const lunchCount = todayOrders.filter((o: any) => o.mealType === 'LUNCH').length;
      const dinnerCount = todayOrders.filter((o: any) => o.mealType === 'DINNER').length;
      const totalMeals = todayOrders.length;

      const locationMap: Record<string, number> = {};
      todayOrders.forEach((o: any) => {
        const city = o.deliveryAddress.city || o.deliveryAddress.label || 'Other';
        locationMap[city] = (locationMap[city] || 0) + 1;
      });

      const deliveryLocations = Object.keys(locationMap).map((city) => ({
        location: city,
        count: locationMap[city],
      }));

      return res.status(200).json({
        success: true,
        data: {
          chef,
          stats: {
            totalMeals,
            breakfastCount,
            lunchCount,
            dinnerCount,
          },
          deliveryLocations,
          todayOrders,
        },
      });
    } catch (error) {
      console.error('Error fetching chef dashboard:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch chef dashboard.' });
    }
  }

  public static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef || chef.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ success: false, error: 'Chef not approved or profile missing.' });
      }

      const orders = await prisma.order.findMany({
        where: { chefId: chef.id },
        include: {
          meal: true,
          deliveryAddress: true,
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { deliveryDate: 'desc' },
      });

      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching chef orders:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch chef orders.' });
    }
  }

  public static async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: { meal: true, deliveryAddress: true },
      });

      return res.status(200).json({ success: true, message: 'Order status updated.', order });
    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ success: false, error: 'Failed to update order status.' });
    }
  }

  public static async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef) {
        return res.status(404).json({ success: false, error: 'Chef profile not found.' });
      }

      const reports = await prisma.chefDailyReport.findMany({
        where: { chefId: chef.id },
        include: { dailyReport: true },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, reports });
    } catch (error) {
      console.error('Error fetching chef daily reports:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch daily reports.' });
    }
  }

  public static async getMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef) {
        return res.status(404).json({ success: false, error: 'Chef profile not found.' });
      }

      const menu = await prisma.meal.findMany({
        where: { chefId: chef.id },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, menu });
    } catch (error) {
      console.error('Error fetching chef menu:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch menu.' });
    }
  }

  public static async createMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chef = await prisma.chef.findUnique({ where: { userId } });

      if (!chef || chef.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ success: false, error: 'Only approved chefs can create menu items.' });
      }

      const { name, description, mealType, imageUrl, price, isAvailable, maxQuantity } = req.body;

      if (!name || !description || !mealType) {
        return res.status(400).json({ success: false, error: 'Name, description, and meal type are required.' });
      }

      const meal = await prisma.meal.create({
        data: {
          chefId: chef.id,
          name,
          description,
          mealType,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
          price: price ? parseFloat(price) : 149,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          maxQuantity: maxQuantity ? parseInt(maxQuantity, 10) : 100,
        },
      });

      return res.status(201).json({ success: true, message: 'Meal added to menu.', meal });
    } catch (error) {
      console.error('Error creating menu item:', error);
      return res.status(500).json({ success: false, error: 'Failed to add menu item.' });
    }
  }

  public static async updateMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, mealType, imageUrl, price, isAvailable, maxQuantity } = req.body;

      const meal = await prisma.meal.update({
        where: { id },
        data: {
          name,
          description,
          mealType,
          imageUrl,
          price: price ? parseFloat(price) : undefined,
          isAvailable,
          maxQuantity: maxQuantity ? parseInt(maxQuantity, 10) : undefined,
        },
      });

      return res.status(200).json({ success: true, message: 'Menu item updated.', meal });
    } catch (error) {
      console.error('Error updating menu item:', error);
      return res.status(500).json({ success: false, error: 'Failed to update menu item.' });
    }
  }

  public static async deleteMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.meal.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Menu item deleted.' });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete menu item.' });
    }
  }
}

export default ChefController;
