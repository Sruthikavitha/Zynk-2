import prisma from '../config/prisma';

export class DailyReportService {
  public static async generateDailyReport(targetDate?: Date) {
    const reportDateObj = targetDate || new Date();
    const reportDate = new Date(reportDateObj.getFullYear(), reportDateObj.getMonth(), reportDateObj.getDate());

    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: reportDate,
          lt: nextDay,
        },
      },
      include: {
        chef: true,
        deliveryAddress: true,
        mealActions: true,
      },
    });

    let totalMeals = 0;
    let totalSkipped = 0;
    let totalSwapped = 0;
    let totalAddressChanges = 0;

    const chefStats: Record<string, {
      chefId: string;
      breakfastCount: number;
      lunchCount: number;
      dinnerCount: number;
      totalMeals: number;
      locations: Record<string, number>;
    }> = {};

    for (const order of orders) {
      const hasSkip = order.mealActions.some((a: any) => a.actionType === 'SKIP') || order.status === 'SKIPPED';
      const hasSwap = order.mealActions.some((a: any) => a.actionType === 'SWAP');
      const hasAddressChange = order.mealActions.some((a: any) => a.actionType === 'ADDRESS_CHANGE');

      if (hasSkip) totalSkipped++;
      if (hasSwap) totalSwapped++;
      if (hasAddressChange) totalAddressChanges++;

      if (order.status !== 'SKIPPED' && order.status !== 'CANCELLED') {
        totalMeals++;

        const chefId = order.chefId;
        if (!chefStats[chefId]) {
          chefStats[chefId] = {
            chefId,
            breakfastCount: 0,
            lunchCount: 0,
            dinnerCount: 0,
            totalMeals: 0,
            locations: {},
          };
        }

        if (order.mealType === 'BREAKFAST') chefStats[chefId].breakfastCount++;
        else if (order.mealType === 'LUNCH') chefStats[chefId].lunchCount++;
        else if (order.mealType === 'DINNER') chefStats[chefId].dinnerCount++;

        chefStats[chefId].totalMeals++;

        const locationLabel = order.deliveryAddress.city || order.deliveryAddress.label || 'Other';
        chefStats[chefId].locations[locationLabel] = (chefStats[chefId].locations[locationLabel] || 0) + 1;
      }
    }

    const dailyReport = await prisma.dailyReport.upsert({
      where: { reportDate },
      update: {
        totalMeals,
        totalSkipped,
        totalSwapped,
        totalAddressChanges,
      },
      create: {
        reportDate,
        totalMeals,
        totalSkipped,
        totalSwapped,
        totalAddressChanges,
      },
    });

    await prisma.chefDailyReport.deleteMany({
      where: { dailyReportId: dailyReport.id },
    });

    for (const chefId of Object.keys(chefStats)) {
      const stats = chefStats[chefId];
      await prisma.chefDailyReport.create({
        data: {
          dailyReportId: dailyReport.id,
          chefId: stats.chefId,
          breakfastCount: stats.breakfastCount,
          lunchCount: stats.lunchCount,
          dinnerCount: stats.dinnerCount,
          totalMeals: stats.totalMeals,
          deliveryGrouping: JSON.stringify(stats.locations),
        },
      });
    }

    console.log(`[DAILY CRON] 8 PM Daily Report generated successfully for ${reportDate.toISOString().split('T')[0]}: Total Meals = ${totalMeals}, Skipped = ${totalSkipped}`);

    return {
      dailyReport,
      chefReportCount: Object.keys(chefStats).length,
    };
  }
}

export default DailyReportService;
