export type Role = 'CUSTOMER' | 'CHEF' | 'ADMIN' | 'DELIVERY_PARTNER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PREPARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'SKIPPED'
  | 'CANCELLED';
export type ActionType = 'SKIP' | 'SWAP' | 'ADDRESS_CHANGE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  chefProfile?: Chef;
}

export interface Chef {
  id: string;
  userId: string;
  kitchenName: string;
  kitchenType: string;
  location: string;
  fssaiNumber?: string;
  description?: string;
  approvalStatus: ApprovalStatus;
  approvedAt?: string;
  createdAt?: string;
  user?: User;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  mealOptions: string;
  features: string;
  isAvailable: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  razorpayOrderId?: string;
  amount: number;
  plan: SubscriptionPlan;
  user?: User;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Meal {
  id: string;
  chefId: string;
  name: string;
  description: string;
  mealType: MealType;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  maxQuantity: number;
  chef?: Chef;
}

export interface MealAction {
  id: string;
  orderId: string;
  userId: string;
  actionType: ActionType;
  originalMealId?: string;
  newMealId?: string;
  originalAddressId?: string;
  newAddressId?: string;
  createdAt: string;
  newMeal?: Meal;
  newAddress?: Address;
}

export interface Order {
  id: string;
  userId: string;
  chefId: string;
  subscriptionId?: string;
  mealId: string;
  deliveryDate: string;
  mealType: MealType;
  status: OrderStatus;
  deliveryAddressId: string;
  createdAt: string;
  meal: Meal;
  chef: Chef;
  deliveryAddress: Address;
  mealActions?: MealAction[];
  user?: User;
}

export interface CutoffStatus {
  allowed: boolean;
  message: string;
  cutoffTime: string;
  isLocked: boolean;
  timeRemaining: string;
}

export interface ChefDailyReport {
  id: string;
  dailyReportId: string;
  chefId: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  deliveryGrouping: string;
  createdAt?: string;
  chef?: Chef;
  dailyReport?: DailyReport;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  totalMeals: number;
  totalSkipped: number;
  totalSwapped: number;
  totalAddressChanges: number;
  chefReports?: ChefDailyReport[];
}
