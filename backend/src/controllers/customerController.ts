import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import MealActionService from '../services/mealActionService';
import CutoffService from '../services/cutoffService';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import geocodingService from '../services/geocodingService';

export class CustomerController {
  public static async getDistricts(req: AuthenticatedRequest, res: Response) {
    try {
      const districts = await prisma.chef.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isActive: true,
          district: { not: '' },
        },
        select: { district: true },
        distinct: ['district'],
        orderBy: { district: 'asc' },
      });

      return res.status(200).json({
        success: true,
        districts: districts.map((item) => item.district).filter(Boolean),
      });
    } catch (error) {
      console.error('Error fetching districts:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch districts.' });
    }
  }

  public static async getKitchens(req: AuthenticatedRequest, res: Response) {
    try {
      const { district, q, mealType, lat, lng, addressId } = req.query;
      const districtFilter = typeof district === 'string' && district.trim() && district.trim().toLowerCase() !== 'all' ? district.trim() : undefined;
      const searchTerm = typeof q === 'string' ? q.trim().toLowerCase() : '';
      const mealTypeFilter = typeof mealType === 'string' ? mealType.toUpperCase() : 'ALL';

      // 1. Determine customer reference coordinates
      let customerLat: number | null = null;
      let customerLng: number | null = null;

      if (lat && lng && !isNaN(parseFloat(lat as string)) && !isNaN(parseFloat(lng as string))) {
        customerLat = parseFloat(lat as string);
        customerLng = parseFloat(lng as string);
      } else if (addressId && typeof addressId === 'string') {
        const address = await prisma.address.findUnique({ where: { id: addressId } });
        if (address?.latitude != null && address?.longitude != null) {
          customerLat = address.latitude;
          customerLng = address.longitude;
        }
      } else if (req.user?.userId) {
        // Fall back to customer's default address (or most recently added address)
        const userAddress = await prisma.address.findFirst({
          where: { userId: req.user.userId, isDefault: true },
        }) || await prisma.address.findFirst({
          where: { userId: req.user.userId },
          orderBy: { createdAt: 'desc' },
        });

        if (userAddress?.latitude != null && userAddress?.longitude != null) {
          customerLat = userAddress.latitude;
          customerLng = userAddress.longitude;
        }
      }

      // 2. Fetch active approved kitchens with optional search & district filters
      const kitchens = await prisma.chef.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isActive: true,
          ...(districtFilter ? { district: { equals: districtFilter, mode: 'insensitive' } } : {}),
          ...(searchTerm ? {
            OR: [
              { kitchenName: { contains: searchTerm, mode: 'insensitive' } },
              { area: { contains: searchTerm, mode: 'insensitive' } },
              { city: { contains: searchTerm, mode: 'insensitive' } },
              { address: { contains: searchTerm, mode: 'insensitive' } },
            ],
          } : {}),
        },
        include: {
          meals: {
            where: mealTypeFilter !== 'ALL' ? { mealType: mealTypeFilter as any } : {},
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { kitchenName: 'asc' },
      });

      // 3. Compute real distance for each kitchen using Haversine formula
      let normalizedKitchens = kitchens.map((kitchen) => {
        const parsedServiceAreas = kitchen.serviceAreas
          ? (typeof kitchen.serviceAreas === 'string' ? JSON.parse(kitchen.serviceAreas) : kitchen.serviceAreas)
          : [];

        let distanceKm: number | null = null;
        let distanceFormatted: string | null = null;
        const radius = kitchen.deliveryRadiusKm ?? 5.0;
        let isWithinRadius = true;

        if (customerLat != null && customerLng != null && kitchen.latitude != null && kitchen.longitude != null) {
          distanceKm = calculateDistanceKm(customerLat, customerLng, kitchen.latitude, kitchen.longitude);
          distanceFormatted = formatDistance(distanceKm);
          isWithinRadius = distanceKm <= radius;
        }

        return {
          ...kitchen,
          deliveryRadiusKm: radius,
          serviceAreas: parsedServiceAreas,
          distanceKm,
          distanceFormatted,
          isWithinRadius,
        };
      });

      // 4. If customer coordinates are present:
      // a) Filter out kitchens outside their deliveryRadiusKm (if distance could be calculated)
      // b) Sort nearest kitchens first
      if (customerLat != null && customerLng != null) {
        normalizedKitchens = normalizedKitchens
          .filter((k) => {
            if (k.distanceKm != null) {
              return k.isWithinRadius;
            }
            // Graceful fallback: If a kitchen has no coordinates, keep it so it's not hidden
            return true;
          })
          .sort((a, b) => {
            if (a.distanceKm != null && b.distanceKm != null) {
              return a.distanceKm - b.distanceKm;
            }
            if (a.distanceKm != null) return -1;
            if (b.distanceKm != null) return 1;
            return a.kitchenName.localeCompare(b.kitchenName);
          });
      }

      const breakfastCount = normalizedKitchens.reduce((sum, kitchen) => sum + kitchen.meals.filter((meal) => meal.mealType === 'BREAKFAST').length, 0);
      const lunchCount = normalizedKitchens.reduce((sum, kitchen) => sum + kitchen.meals.filter((meal) => meal.mealType === 'LUNCH').length, 0);
      const dinnerCount = normalizedKitchens.reduce((sum, kitchen) => sum + kitchen.meals.filter((meal) => meal.mealType === 'DINNER').length, 0);

      return res.status(200).json({
        success: true,
        district: districtFilter || 'All',
        count: normalizedKitchens.length,
        customerCoordinates: customerLat != null && customerLng != null ? { lat: customerLat, lng: customerLng } : null,
        summary: {
          homeKitchens: normalizedKitchens.length,
          breakfastMenus: breakfastCount,
          lunchMenus: lunchCount,
          dinnerMenus: dinnerCount,
        },
        kitchens: normalizedKitchens,
      });
    } catch (error) {
      console.error('Error fetching kitchens:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch kitchen list.' });
    }
  }

  public static async getKitchenById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const kitchen = await prisma.chef.findFirst({
        where: {
          id,
          approvalStatus: 'APPROVED',
          isActive: true,
        },
        include: {
          meals: {
            orderBy: { mealType: 'asc' },
          },
        },
      });

      if (!kitchen) {
        return res.status(404).json({ success: false, error: 'Kitchen not found.' });
      }

      return res.status(200).json({
        success: true,
        kitchen: {
          ...kitchen,
          serviceAreas: kitchen.serviceAreas ? (typeof kitchen.serviceAreas === 'string' ? JSON.parse(kitchen.serviceAreas) : kitchen.serviceAreas) : [],
        },
      });
    } catch (error) {
      console.error('Error fetching kitchen details:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch kitchen details.' });
    }
  }

  public static async getKitchenMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const meals = await prisma.meal.findMany({
        where: {
          chefId: id,
          isAvailable: true,
        },
        orderBy: [{ mealType: 'asc' }, { createdAt: 'desc' }],
      });

      return res.status(200).json({ success: true, meals });
    } catch (error) {
      console.error('Error fetching kitchen menu:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch kitchen menu.' });
    }
  }

  public static async getKitchenServiceAreas(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const kitchen = await prisma.chef.findUnique({
        where: { id },
        select: { serviceAreas: true, district: true, city: true, area: true },
      });

      if (!kitchen) {
        return res.status(404).json({ success: false, error: 'Kitchen not found.' });
      }

      const serviceAreas = kitchen.serviceAreas
        ? (typeof kitchen.serviceAreas === 'string' ? JSON.parse(kitchen.serviceAreas) : kitchen.serviceAreas)
        : [];

      return res.status(200).json({
        success: true,
        serviceAreas,
        kitchen: {
          district: kitchen.district,
          city: kitchen.city,
          area: kitchen.area,
        },
      });
    } catch (error) {
      console.error('Error fetching service areas:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch kitchen service areas.' });
    }
  }

  public static async checkKitchenServiceability(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { district, city, area, street, postalCode, addressId, lat, lng, latitude, longitude } = req.body;

      const kitchen = await prisma.chef.findUnique({
        where: { id },
      });

      if (!kitchen) {
        return res.status(404).json({ success: false, error: 'Kitchen not found.' });
      }

      const deliveryRadiusKm = kitchen.deliveryRadiusKm ?? 5.0;

      // 1. Determine customer coordinates
      let userLat: number | null = null;
      let userLng: number | null = null;

      const inputLat = lat ?? latitude;
      const inputLng = lng ?? longitude;
      if (inputLat != null && inputLng != null && !isNaN(parseFloat(inputLat)) && !isNaN(parseFloat(inputLng))) {
        userLat = parseFloat(inputLat);
        userLng = parseFloat(inputLng);
      } else if (addressId && typeof addressId === 'string') {
        const address = await prisma.address.findUnique({ where: { id: addressId } });
        if (address?.latitude != null && address?.longitude != null) {
          userLat = address.latitude;
          userLng = address.longitude;
        } else if (address) {
          // Geocode on the fly if coordinates were not yet populated
          const coords = await geocodingService.geocodeAddress({
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
          });
          if (coords) {
            userLat = coords.lat;
            userLng = coords.lng;
            await prisma.address.update({
              where: { id: address.id },
              data: { latitude: coords.lat, longitude: coords.lng },
            }).catch(() => {});
          }
        }
      } else if (street || city || area || district || postalCode) {
        // Geocode the provided address fields
        const coords = await geocodingService.geocodeAddress({
          street: street || area,
          area,
          city: city || district,
          state: 'Tamil Nadu',
          postalCode,
        });
        if (coords) {
          userLat = coords.lat;
          userLng = coords.lng;
        }
      }

      // 2. Real distance-based serviceability check
      if (userLat != null && userLng != null && kitchen.latitude != null && kitchen.longitude != null) {
        const distanceKm = calculateDistanceKm(userLat, userLng, kitchen.latitude, kitchen.longitude);
        const serviceable = distanceKm <= deliveryRadiusKm;
        const formatted = formatDistance(distanceKm);

        return res.status(200).json({
          success: true,
          serviceable,
          distanceKm,
          distanceFormatted: formatted,
          deliveryRadiusKm,
          message: serviceable
            ? `✓ This kitchen delivers to your location (${formatted}, delivery radius is ${deliveryRadiusKm} km).`
            : `This kitchen is ${formatted}, which exceeds its ${deliveryRadiusKm} km delivery radius.`,
        });
      }

      // 3. Graceful fallback: string-based matching if coordinates could not be resolved
      const parsedAreas = kitchen.serviceAreas
        ? (typeof kitchen.serviceAreas === 'string' ? JSON.parse(kitchen.serviceAreas) : kitchen.serviceAreas)
        : [];

      const normalizedDistrict = String(district || kitchen.district || '').trim().toLowerCase();
      const normalizedCity = String(city || kitchen.city || '').trim().toLowerCase();
      const normalizedArea = String(area || kitchen.area || '').trim().toLowerCase();
      const kitchenDistrict = String(kitchen.district || '').trim().toLowerCase();
      const kitchenCity = String(kitchen.city || '').trim().toLowerCase();
      const kitchenArea = String(kitchen.area || '').trim().toLowerCase();
      const areaList = parsedAreas.map((entry: string) => entry.toLowerCase());

      const serviceable = (
        normalizedDistrict === kitchenDistrict ||
        normalizedCity === kitchenCity ||
        normalizedArea === kitchenArea ||
        areaList.includes(normalizedArea) ||
        areaList.includes(normalizedCity) ||
        areaList.includes(normalizedDistrict)
      );

      return res.status(200).json({
        success: true,
        serviceable,
        deliveryRadiusKm,
        message: serviceable
          ? '✓ This kitchen delivers to your location area.'
          : 'This kitchen does not currently deliver to your selected address area.',
      });
    } catch (error) {
      console.error('Error validating kitchen serviceability:', error);
      return res.status(500).json({ success: false, error: 'Failed to validate kitchen serviceability.' });
    }
  }

  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Active Subscription
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: today },
        },
        include: { plan: true },
      });

      // Today's Meals
      const todaysMeals = await prisma.order.findMany({
        where: {
          userId,
          deliveryDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          meal: true,
          chef: true,
          deliveryAddress: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Next Upcoming Meal
      const nextMeal = await prisma.order.findFirst({
        where: {
          userId,
          deliveryDate: { gte: today },
          status: { in: ['CONFIRMED', 'PREPARING', 'PREPARED'] },
        },
        include: {
          meal: true,
          chef: true,
          deliveryAddress: true,
        },
        orderBy: { deliveryDate: 'asc' },
      });

      const cutoffStatus = CutoffService.getSystemCutoffStatus();

      return res.status(200).json({
        success: true,
        data: {
          activeSubscription,
          todaysMeals,
          nextMeal,
          cutoffStatus,
          user: {
            name: req.user!.name,
            email: req.user!.email,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching customer dashboard:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch customer dashboard.' });
    }
  }

  public static async getPlans(req: AuthenticatedRequest, res: Response) {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isAvailable: true },
        orderBy: { price: 'asc' },
      });

      return res.status(200).json({ success: true, plans });
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch subscription plans.' });
    }
  }

  public static async getSubscriptions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, subscriptions });
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch subscriptions.' });
    }
  }

  public static async getMeals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const meals = await prisma.order.findMany({
        where: {
          userId,
          deliveryDate: { gte: today },
        },
        include: {
          meal: true,
          chef: true,
          deliveryAddress: true,
          mealActions: true,
          delivery: true,
        },
        orderBy: [
          { deliveryDate: 'asc' },
          { mealType: 'asc' },
        ],
      });

      const cutoffStatus = CutoffService.getSystemCutoffStatus();

      return res.status(200).json({
        success: true,
        meals,
        cutoffStatus,
      });
    } catch (error) {
      console.error('Error fetching upcoming meals:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch upcoming meals.' });
    }
  }

  public static async skipMeal(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id: orderId } = req.params;

      const updatedOrder = await MealActionService.skipMeal(userId, orderId);

      return res.status(200).json({
        success: true,
        message: 'Meal skipped successfully.',
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error('Error skipping meal:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to skip meal.' });
    }
  }

  public static async swapMeal(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id: orderId } = req.params;
      const { newMealId } = req.body;

      if (!newMealId) {
        return res.status(400).json({ success: false, error: 'Replacement meal ID is required.' });
      }

      const updatedOrder = await MealActionService.swapMeal(userId, orderId, newMealId);

      return res.status(200).json({
        success: true,
        message: 'Meal swapped successfully.',
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error('Error swapping meal:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to swap meal.' });
    }
  }

  public static async changeMealAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id: orderId } = req.params;
      const { newAddressId } = req.body;

      if (!newAddressId) {
        return res.status(400).json({ success: false, error: 'Target delivery address ID is required.' });
      }

      const updatedOrder = await MealActionService.changeMealAddress(userId, orderId, newAddressId);

      return res.status(200).json({
        success: true,
        message: 'Delivery address for this meal updated successfully.',
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error('Error changing meal address:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to update address.' });
    }
  }

  public static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const history = await prisma.order.findMany({
        where: { userId },
        include: {
          meal: true,
          chef: true,
          deliveryAddress: true,
          mealActions: {
            include: {
              newMeal: true,
              newAddress: true,
            },
          },
        },
        orderBy: { deliveryDate: 'desc' },
      });

      return res.status(200).json({ success: true, history });
    } catch (error) {
      console.error('Error fetching meal history:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch meal history.' });
    }
  }

  public static async getAddresses(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });

      return res.status(200).json({ success: true, addresses });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch addresses.' });
    }
  }

  public static async createAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { label, street, city, state, postalCode, isDefault, latitude, longitude } = req.body;

      if (!label || !street || !city || !state || !postalCode) {
        return res.status(400).json({ success: false, error: 'All address fields are required.' });
      }

      let lat = latitude != null && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null;
      let lng = longitude != null && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

      // Automatically geocode coordinates if not provided directly
      if (lat == null || lng == null) {
        const coords = await geocodingService.geocodeAddress({ street, city, state, postalCode });
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: {
          userId,
          label,
          street,
          city,
          state,
          postalCode,
          latitude: lat,
          longitude: lng,
          isDefault: isDefault || false,
        },
      });

      return res.status(201).json({ success: true, address });
    } catch (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ success: false, error: 'Failed to create address.' });
    }
  }

  public static async updateAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { label, street, city, state, postalCode, isDefault, latitude, longitude } = req.body;

      const existingAddress = await prisma.address.findUnique({ where: { id } });
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Address not found.' });
      }

      let lat = latitude != null && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : existingAddress.latitude;
      let lng = longitude != null && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : existingAddress.longitude;

      // Re-geocode if address text changed and new coordinates were not manually provided
      const addressChanged = street !== existingAddress.street || city !== existingAddress.city || postalCode !== existingAddress.postalCode;
      if (addressChanged && (latitude == null || longitude == null)) {
        const coords = await geocodingService.geocodeAddress({
          street: street || existingAddress.street,
          city: city || existingAddress.city,
          state: state || existingAddress.state,
          postalCode: postalCode || existingAddress.postalCode,
        });
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const updatedAddress = await prisma.address.update({
        where: { id },
        data: {
          label,
          street,
          city,
          state,
          postalCode,
          latitude: lat,
          longitude: lng,
          isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
        },
      });

      return res.status(200).json({ success: true, address: updatedAddress });
    } catch (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ success: false, error: 'Failed to update address.' });
    }
  }
}

export default CustomerController;
