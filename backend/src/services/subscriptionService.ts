import prisma from '../config/prisma';
import { MealType } from '../types';

export class SubscriptionService {
  public static async activateSubscription(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Subscription plan not found.');
    }

    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        paymentId,
        razorpayOrderId,
        amount: plan.price,
      },
      include: {
        plan: true,
      },
    });

    let defaultAddress = await prisma.address.findFirst({
      where: { userId, isDefault: true },
    });

    if (!defaultAddress) {
      defaultAddress = await prisma.address.findFirst({
        where: { userId },
      });
    }

    if (!defaultAddress) {
      defaultAddress = await prisma.address.create({
        data: {
          userId,
          label: 'Home',
          street: '12, Main Street',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          postalCode: '641035',
          isDefault: true,
        },
      });
    }

    const availableMeals = await prisma.meal.findMany({
      where: {
        isAvailable: true,
        chef: {
          approvalStatus: 'APPROVED',
        },
      },
      include: {
        chef: true,
      },
    });

    const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
    const ordersToCreate = [];

    for (let day = 0; day < plan.durationDays; day++) {
      const deliveryDate = new Date(startDate);
      deliveryDate.setDate(startDate.getDate() + day);

      for (const mealType of mealTypes) {
        const matchingMeal = availableMeals.find((m: any) => m.mealType === mealType) || availableMeals[0];

        if (matchingMeal) {
          ordersToCreate.push({
            userId,
            chefId: matchingMeal.chefId,
            subscriptionId: subscription.id,
            mealId: matchingMeal.id,
            deliveryDate,
            mealType,
            status: 'CONFIRMED' as const,
            deliveryAddressId: defaultAddress.id,
          });
        }
      }
    }

    if (ordersToCreate.length > 0) {
      await prisma.order.createMany({
        data: ordersToCreate,
      });
    }

    return subscription;
  }
}

export default SubscriptionService;
