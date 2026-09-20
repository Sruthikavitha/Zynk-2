export type Role = 'CUSTOMER' | 'CHEF' | 'ADMIN' | 'DELIVERY_PARTNER';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
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
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
