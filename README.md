# ZYNK – Flexible Food Subscription Platform

**ZYNK** connects customers with cloud kitchens and local chefs through a flexible food subscription system featuring an **8:00 PM daily cutoff lock** for Skip, Swap, and Address Change requests.

---

## 🌟 Tech Stack Architecture

```
React Frontend (Vite + TS + Tailwind CSS)
                 │
           REST API (Axios)
                 │
                 ▼
Express Backend API (Node.js + TypeScript)
                 │
            Prisma ORM
                 │
                 ▼
        PostgreSQL Database
```

---

## 🚀 Quick Setup & Installation

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` inside `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zynk_db?schema=public"
JWT_SECRET="zynk_super_secret_jwt_key_2026_flexible_food_subscription"
RAZORPAY_KEY_ID="rzp_test_zynk_key_12345"
RAZORPAY_KEY_SECRET="zynk_razorpay_secret_67890"
CLIENT_URL="http://localhost:5173"
DEFAULT_CUTOFF_TIME="20:00"
```

### 3. Database Migration & Seed Data
```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Run Development Servers
```bash
# Start Backend API (runs on http://localhost:5000)
cd backend
npm run dev

# Start Frontend App (runs on http://localhost:5173)
cd frontend
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@zynk.com` | `admin123` | `/admin/dashboard` |
| **Chef (Approved)** | `chef@zynk.com` | `chef123` | `/chef/dashboard` |
| **Chef (Pending)** | `newchef@zynk.com` | `chef123` | `/chef/application-status` |
| **Customer** | `customer@zynk.com` | `customer123` | `/customer/dashboard` |

---

## 🔒 Core 8 PM Daily Cutoff Logic

1. **Backend Enforcement**:
   - Every modification request (`/api/customer/meals/:id/skip`, `/swap`, `/address`) passes through `validate8PMCutoff` middleware and `check8PMCutoff` service.
   - If current time $\ge$ 8:00 PM (`20:00`), the backend strictly rejects changes with `HTTP 400 Bad Request`:
     ```json
     {
       "success": false,
       "error": "Meal changes are locked after 8:00 PM."
     }
     ```
2. **Automated Daily Reports Cron Job**:
   - `node-cron` triggers every day at `0 20 * * *` (8:00 PM).
   - Generates chef-wise and location-wise delivery aggregation reports stored in `DailyReport` and `ChefDailyReport` tables in PostgreSQL.
   - Admin can also manually trigger the daily report job on demand via the Admin Reports dashboard (`/admin/reports`).

---

## 💳 Razorpay Payment Integration

- Integrated with Razorpay Checkout & backend signature verification.
- Includes development mock simulation mode: if test keys are used, subscription orders are activated and verified seamlessly during local testing.
