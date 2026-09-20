import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import DailyReportService from '../services/dailyReportService';

export class AdminController {
  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
      const activeChefs = await prisma.chef.count({ where: { approvalStatus: 'APPROVED' } });
      const pendingChefApprovals = await prisma.chef.count({ where: { approvalStatus: 'PENDING' } });

      const todaysMeals = await prisma.order.count({
        where: {
          deliveryDate: { gte: today },
          status: { notIn: ['SKIPPED', 'CANCELLED'] },
        },
      });

      const revenueAggregate = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
      });
      const totalRevenue = revenueAggregate._sum.amount || 0;

      const planStats = await prisma.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        where: { status: 'ACTIVE' },
      });

      const plans = await prisma.subscriptionPlan.findMany();
      const subscriptionDistribution = plans.map((plan: any) => {
        const found = planStats.find((p: any) => p.planId === plan.id);
        return {
          name: plan.name,
          count: found ? found._count.id : 0,
        };
      });

      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          chef: { select: { kitchenName: true } },
          meal: { select: { name: true, mealType: true } },
        },
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          activeSubscriptions,
          activeChefs,
          pendingChefApprovals,
          todaysMeals,
          totalRevenue,
        },
        subscriptionDistribution,
        recentOrders,
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch admin dashboard.' });
    }
  }

  public static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch users.' });
    }
  }

  public static async toggleUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error toggling user status:', error);
      return res.status(500).json({ success: false, error: 'Failed to update user status.' });
    }
  }

  public static async getChefs(req: AuthenticatedRequest, res: Response) {
    try {
      const chefs = await prisma.chef.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, chefs });
    } catch (error) {
      console.error('Error fetching chefs:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch chef applications.' });
    }
  }

  public static async approveChef(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const chef = await prisma.chef.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Chef application approved successfully.',
        chef,
      });
    } catch (error) {
      console.error('Error approving chef:', error);
      return res.status(500).json({ success: false, error: 'Failed to approve chef application.' });
    }
  }

  public static async rejectChef(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const chef = await prisma.chef.update({
        where: { id },
        data: { approvalStatus: 'REJECTED' },
      });

      return res.status(200).json({
        success: true,
        message: 'Chef application rejected.',
        chef,
      });
    } catch (error) {
      console.error('Error rejecting chef:', error);
      return res.status(500).json({ success: false, error: 'Failed to reject chef application.' });
    }
  }

  public static async getSubscriptions(req: AuthenticatedRequest, res: Response) {
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, subscriptions });
    } catch (error) {
      console.error('Error fetching admin subscriptions:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch subscriptions.' });
    }
  }

  public static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true, phone: true } },
          chef: { select: { kitchenName: true } },
          meal: { select: { name: true, mealType: true } },
          deliveryAddress: true,
        },
        orderBy: { deliveryDate: 'desc' },
      });

      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
    }
  }

  public static async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const reports = await prisma.dailyReport.findMany({
        include: {
          chefReports: {
            include: { chef: { select: { kitchenName: true } } },
          },
        },
        orderBy: { reportDate: 'desc' },
      });

      return res.status(200).json({ success: true, reports });
    } catch (error) {
      console.error('Error fetching admin daily reports:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch daily reports.' });
    }
  }

  public static async triggerDailyReport(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await DailyReportService.generateDailyReport();
      return res.status(200).json({
        success: true,
        message: '8 PM Daily Report generated manually for today.',
        result,
      });
    } catch (error) {
      console.error('Error triggering daily report manually:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate daily report.' });
    }
  }
}

export default AdminController;
