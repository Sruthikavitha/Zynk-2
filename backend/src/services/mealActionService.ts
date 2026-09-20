import prisma from '../config/prisma';

export class MealActionService {
  /**
   * Skip an upcoming meal
   */
  public static async skipMeal(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new Error('Order not found or unauthorized.');
    }

    if (order.status === 'SKIPPED') {
      throw new Error('Meal is already skipped.');
    }

    // Update order status to SKIPPED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SKIPPED' },
    });

    // Record action log
    await prisma.mealAction.create({
      data: {
        orderId,
        userId,
        actionType: 'SKIP',
        originalMealId: order.mealId,
        originalAddressId: order.deliveryAddressId,
      },
    });

    return updatedOrder;
  }

  /**
   * Swap meal for an upcoming order
   */
  public static async swapMeal(userId: string, orderId: string, newMealId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new Error('Order not found or unauthorized.');
    }

    const newMeal = await prisma.meal.findUnique({
      where: { id: newMealId },
    });

    if (!newMeal || !newMeal.isAvailable) {
      throw new Error('Selected replacement meal is unavailable.');
    }

    const originalMealId = order.mealId;

    // Update order with new meal ID and chef ID if applicable
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        mealId: newMealId,
        chefId: newMeal.chefId,
        status: 'CONFIRMED', // reset status if previously skipped
      },
      include: {
        meal: true,
        chef: true,
      },
    });

    // Record action log
    await prisma.mealAction.create({
      data: {
        orderId,
        userId,
        actionType: 'SWAP',
        originalMealId,
        newMealId,
        originalAddressId: order.deliveryAddressId,
      },
    });

    return updatedOrder;
  }

  /**
   * Override address for a specific meal
   */
  public static async changeMealAddress(userId: string, orderId: string, newAddressId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new Error('Order not found or unauthorized.');
    }

    const address = await prisma.address.findUnique({
      where: { id: newAddressId },
    });

    if (!address || address.userId !== userId) {
      throw new Error('Target address not found.');
    }

    const originalAddressId = order.deliveryAddressId;

    // Update order delivery address
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { deliveryAddressId: newAddressId },
      include: { deliveryAddress: true },
    });

    // Record action log
    await prisma.mealAction.create({
      data: {
        orderId,
        userId,
        actionType: 'ADDRESS_CHANGE',
        originalMealId: order.mealId,
        originalAddressId,
        newAddressId,
      },
    });

    return updatedOrder;
  }
}

export default MealActionService;
