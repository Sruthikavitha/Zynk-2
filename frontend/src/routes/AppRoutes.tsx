import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layouts/PublicLayout';
import CustomerLayout from '../components/layouts/CustomerLayout';
import ChefLayout from '../components/layouts/ChefLayout';
import AdminLayout from '../components/layouts/AdminLayout';

// Protection
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';

// Customer Pages
import CustomerDashboardPage from '../pages/customer/CustomerDashboardPage';
import FindKitchenPage from '../pages/customer/FindKitchenPage';
import KitchenDetailsPage from '../pages/customer/KitchenDetailsPage';
import SubscriptionPlansPage from '../pages/customer/SubscriptionPlansPage';
import CustomerSubscriptionsPage from '../pages/customer/CustomerSubscriptionsPage';
import UpcomingMealsPage from '../pages/customer/UpcomingMealsPage';
import MealHistoryPage from '../pages/customer/MealHistoryPage';
import AddressBookPage from '../pages/customer/AddressBookPage';
import CustomerProfilePage from '../pages/customer/CustomerProfilePage';

// Chef Pages
import ChefRegisterPage from '../pages/chef/ChefRegisterPage';
import ChefApplicationStatusPage from '../pages/chef/ChefApplicationStatusPage';
import ChefDashboardPage from '../pages/chef/ChefDashboardPage';
import ChefOrdersPage from '../pages/chef/ChefOrdersPage';
import ChefReportsPage from '../pages/chef/ChefReportsPage';
import ChefMenuPage from '../pages/chef/ChefMenuPage';
import ChefProfilePage from '../pages/chef/ChefProfilePage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminChefsPage from '../pages/admin/AdminChefsPage';
import AdminSubscriptionsPage from '../pages/admin/AdminSubscriptionsPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminDeliveryPage from '../pages/admin/AdminDeliveryPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/chef/login" element={<Navigate to="/login" replace />} />
        <Route path="/chef/register" element={<ChefRegisterPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Customer Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/customer/find-kitchen" element={<FindKitchenPage />} />
          <Route path="/customer/kitchen/:kitchenId" element={<KitchenDetailsPage />} />
          <Route path="/customer/subscriptions" element={<CustomerSubscriptionsPage />} />
          <Route path="/customer/subscriptions/plans" element={<SubscriptionPlansPage />} />
          <Route path="/customer/meals" element={<UpcomingMealsPage />} />
          <Route path="/customer/history" element={<MealHistoryPage />} />
          <Route path="/customer/address" element={<AddressBookPage />} />
          <Route path="/customer/profile" element={<CustomerProfilePage />} />
        </Route>
      </Route>

      {/* Chef Application Status & Dashboard Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CHEF', 'ADMIN']} />}>
        <Route element={<PublicLayout />}>
          <Route path="/chef/application-status" element={<ChefApplicationStatusPage />} />
        </Route>
        <Route element={<ChefLayout />}>
          <Route path="/chef/dashboard" element={<ChefDashboardPage />} />
          <Route path="/chef/orders" element={<ChefOrdersPage />} />
          <Route path="/chef/reports" element={<ChefReportsPage />} />
          <Route path="/chef/menu" element={<ChefMenuPage />} />
          <Route path="/chef/profile" element={<ChefProfilePage />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/chefs" element={<AdminChefsPage />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
