import { PrismaClient, Role, ApprovalStatus, MealType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ZYNK Database Seeding...');

  // Clean existing data in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.chefDailyReport.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.mealAction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.address.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.chef.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = await bcrypt.hash('zynk1234', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const chefPasswordHash = await bcrypt.hash('chef123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@zynk.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created: admin@zynk.com');

  // 2. Create Approved Chefs
  const chef1User = await prisma.user.create({
    data: {
      name: 'Chef Rajesh Kumar',
      email: 'chef@zynk.com',
      phone: '9876543211',
      passwordHash: chefPasswordHash,
      role: Role.CHEF,
    },
  });

  const chef1Profile = await prisma.chef.create({
    data: {
      userId: chef1User.id,
      kitchenName: 'ABC Cloud Kitchen',
      kitchenType: 'Cloud Kitchen',
      location: 'Coimbatore',
      fssaiNumber: '12421003000456',
      description: 'Specializing in authentic South & North Indian daily subscription thalis.',
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  const chef2User = await prisma.user.create({
    data: {
      name: 'Chef Anitha Sharma',
      email: 'chef2@zynk.com',
      phone: '9876543212',
      passwordHash: chefPasswordHash,
      role: Role.CHEF,
    },
  });

  const chef2Profile = await prisma.chef.create({
    data: {
      userId: chef2User.id,
      kitchenName: 'South Spices Home Kitchen',
      kitchenType: 'Home Kitchen',
      location: 'Tiruppur',
      fssaiNumber: '12422004000789',
      description: 'Hygienic home-cooked traditional meals delivered fresh.',
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  // Pending Chef Application
  const pendingChefUser = await prisma.user.create({
    data: {
      name: 'Chef Vikram Singh',
      email: 'newchef@zynk.com',
      phone: '9876543213',
      passwordHash: chefPasswordHash,
      role: Role.CHEF,
    },
  });

  await prisma.chef.create({
    data: {
      userId: pendingChefUser.id,
      kitchenName: 'FreshBite Organic Kitchen',
      kitchenType: 'Cloud Kitchen',
      location: 'Coimbatore',
      fssaiNumber: '12423005000999',
      description: 'Organic high-protein custom fitness subscriptions.',
      approvalStatus: ApprovalStatus.PENDING,
    },
  });
  console.log('✅ Chefs created (ABC Cloud Kitchen, South Spices, FreshBite Pending)');

  // 3. Create Subscription Plans
  const planBasic = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic Plan',
      description: 'Essential nutritious home-cooked meals for daily sustenance.',
      price: 149.0,
      durationDays: 7,
      mealOptions: 'Breakfast, Lunch & Dinner',
      features: JSON.stringify(['3 Meals / Day', 'Standard Menu Selection', 'Standard Delivery', 'Flexible Skip & Swap']),
    },
  });

  const planRegular = await prisma.subscriptionPlan.create({
    data: {
      name: 'Regular Plan',
      description: 'Most popular balanced meal plan with beverages and chef specials.',
      price: 199.0,
      durationDays: 7,
      mealOptions: 'Breakfast, Lunch, Dinner + Beverage',
      features: JSON.stringify(['3 Meals / Day', 'Extended Chef Specials', 'Priority 8 PM Skip/Swap', 'Free Daily Drink']),
    },
  });

  const planPremium = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium Gourmet Plan',
      description: 'Luxury gourmet dining experience with organic high-protein options.',
      price: 249.0,
      durationDays: 7,
      mealOptions: 'Gourmet Custom Breakfast, Lunch & Dinner',
      features: JSON.stringify(['3 Meals / Day', 'Gourmet & Organic Selection', 'Zero Cancellation Fees', 'Dedicated Support']),
    },
  });
  console.log('✅ Subscription Plans created (Basic: ₹149, Regular: ₹199, Premium: ₹249)');

  // 4. Create Customers & Addresses
  const customer1 = await prisma.user.create({
    data: {
      name: 'Sharan Kumar',
      email: 'customer@zynk.com',
      phone: '9876543220',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  const addressHome = await prisma.address.create({
    data: {
      userId: customer1.id,
      label: 'Home',
      street: '12, Edayarpalayam Main Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641025',
      isDefault: true,
    },
  });

  const addressCollege = await prisma.address.create({
    data: {
      userId: customer1.id,
      label: 'College',
      street: 'KGiSL Institute of Technology, CHIL SEZ Campus',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641035',
      isDefault: false,
    },
  });

  const addressWork = await prisma.address.create({
    data: {
      userId: customer1.id,
      label: 'Work',
      street: 'Tidel Park Coimbatore, Module 302',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641014',
      isDefault: false,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@zynk.com',
      phone: '9876543221',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer2.id,
      label: 'Home',
      street: '45, Avinashi Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641018',
      isDefault: true,
    },
  });
  console.log('✅ Customers & Address Book created');

  // 5. Create Meals
  const mealsData = [
    {
      chefId: chef1Profile.id,
      name: 'Traditional South Indian Breakfast Thali',
      description: 'Fresh Idli (3 pcs), Soft Vada, Sambar, Coconut & Tomato Chutney.',
      mealType: MealType.BREAKFAST,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60',
      price: 60.0,
    },
    {
      chefId: chef1Profile.id,
      name: 'Puri Masala Special',
      description: 'Fluffy whole wheat puris (4 pcs) served with rich potato masala.',
      mealType: MealType.BREAKFAST,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60',
      price: 70.0,
    },
    {
      chefId: chef1Profile.id,
      name: 'Royal South Indian Meals Thali',
      description: 'Rice, Sambar, Rasam, Karakuzhambu, Poriyal, Kootu, Curd & Appalam.',
      mealType: MealType.LUNCH,
      imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=60',
      price: 120.0,
    },
    {
      chefId: chef1Profile.id,
      name: 'Chicken Dum Biryani Combo',
      description: 'Fragrant Seeraga Samba Chicken Biryani, Raitha & Salna.',
      mealType: MealType.LUNCH,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
      price: 160.0,
    },
    {
      chefId: chef1Profile.id,
      name: 'Paneer Butter Masala & Soft Phulkas',
      description: '3 Soft Butter Phulkas with creamy Cottage Cheese gravy & Jeera Rice.',
      mealType: MealType.DINNER,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60',
      price: 130.0,
    },
    {
      chefId: chef2Profile.id,
      name: 'Crispy Ghee Roast Dosa',
      description: 'Golden crunchy ghee dosa with potato filling & special coconut chutney.',
      mealType: MealType.BREAKFAST,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60',
      price: 65.0,
    },
    {
      chefId: chef2Profile.id,
      name: 'North Indian Executive Thali',
      description: 'Jeera Rice, 2 Chapathis, Dal Makhani, Paneer Gravy, Salad & Gulab Jamun.',
      mealType: MealType.LUNCH,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60',
      price: 140.0,
    },
    {
      chefId: chef2Profile.id,
      name: 'Light Dinner Chapathi & Kadai Veg',
      description: '3 Whole Wheat Chapathis with mixed vegetable kadai curry.',
      mealType: MealType.DINNER,
      imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&auto=format&fit=crop&q=60',
      price: 100.0,
    },
  ];

  const createdMeals = [];
  for (const m of mealsData) {
    const meal = await prisma.meal.create({ data: m });
    createdMeals.push(meal);
  }
  console.log(`✅ ${createdMeals.length} Meals created across chefs`);

  // 6. Active Subscription for Customer 1
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7);

  const subscription = await prisma.subscription.create({
    data: {
      userId: customer1.id,
      planId: planRegular.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      razorpayOrderId: 'order_seed_998877',
      amount: planRegular.price,
    },
  });

  // Create Orders for Today and Tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today Breakfast
  const orderTodayBreakfast = await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef1Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[0].id, // South Indian Breakfast
      deliveryDate: today,
      mealType: MealType.BREAKFAST,
      status: OrderStatus.DELIVERED,
      deliveryAddressId: addressHome.id,
    },
  });

  // Today Lunch (Swapped to Biryani at College)
  const orderTodayLunch = await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef1Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[3].id, // Biryani
      deliveryDate: today,
      mealType: MealType.LUNCH,
      status: OrderStatus.CONFIRMED,
      deliveryAddressId: addressCollege.id,
    },
  });

  await prisma.mealAction.create({
    data: {
      orderId: orderTodayLunch.id,
      userId: customer1.id,
      actionType: 'SWAP',
      originalMealId: createdMeals[2].id,
      newMealId: createdMeals[3].id,
      originalAddressId: addressHome.id,
      newAddressId: addressCollege.id,
    },
  });

  // Today Dinner
  const orderTodayDinner = await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef1Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[4].id, // Paneer Butter Masala
      deliveryDate: today,
      mealType: MealType.DINNER,
      status: OrderStatus.PREPARING,
      deliveryAddressId: addressHome.id,
    },
  });

  // Tomorrow Breakfast
  await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef2Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[5].id, // Ghee Roast Dosa
      deliveryDate: tomorrow,
      mealType: MealType.BREAKFAST,
      status: OrderStatus.CONFIRMED,
      deliveryAddressId: addressHome.id,
    },
  });

  // Tomorrow Lunch
  await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef1Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[2].id, // South Indian Meals
      deliveryDate: tomorrow,
      mealType: MealType.LUNCH,
      status: OrderStatus.CONFIRMED,
      deliveryAddressId: addressCollege.id,
    },
  });

  // Tomorrow Dinner (Skipped)
  const orderTomorrowDinner = await prisma.order.create({
    data: {
      userId: customer1.id,
      chefId: chef2Profile.id,
      subscriptionId: subscription.id,
      mealId: createdMeals[7].id, // Chapathi
      deliveryDate: tomorrow,
      mealType: MealType.DINNER,
      status: OrderStatus.SKIPPED,
      deliveryAddressId: addressHome.id,
    },
  });

  await prisma.mealAction.create({
    data: {
      orderId: orderTomorrowDinner.id,
      userId: customer1.id,
      actionType: 'SKIP',
      originalMealId: createdMeals[7].id,
      originalAddressId: addressHome.id,
    },
  });

  console.log('✅ Subscriptions, Daily Orders & Meal Actions seeded');

  // 7. Initial Daily Report for Today
  const dailyReport = await prisma.dailyReport.create({
    data: {
      reportDate: today,
      totalMeals: 320,
      totalSkipped: 18,
      totalSwapped: 24,
      totalAddressChanges: 15,
    },
  });

  await prisma.chefDailyReport.create({
    data: {
      dailyReportId: dailyReport.id,
      chefId: chef1Profile.id,
      breakfastCount: 80,
      lunchCount: 150,
      dinnerCount: 90,
      totalMeals: 320,
      deliveryGrouping: JSON.stringify({
        'KGiSL College': 120,
        'Coimbatore Main': 100,
        'Tiruppur': 60,
        'Other': 40,
      }),
    },
  });

  console.log('✅ Daily Report & Chef Breakdown seeded');
  console.log('=======================================================');
  console.log('🎉 Seeding completed successfully!');
  console.log('🔑 DEMO CREDENTIALS:');
  console.log('   ADMIN:    email: admin@zynk.com    password: admin123');
  console.log('   CHEF:     email: chef@zynk.com     password: chef123');
  console.log('   CUSTOMER: email: customer@zynk.com password: customer123');
  console.log('=======================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
