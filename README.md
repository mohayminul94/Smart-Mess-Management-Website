# Smart Mess Management System 🇧🇩

A complete, functional, production-oriented financial and meal management system tailored for shared bachelor messes in Bangladesh. Built with Next.js App Router (JavaScript/JSX), Tailwind CSS, Node.js, Express, MongoDB Atlas, and Mongoose.

---

## 🌟 Key Features

1. **Manager-Only Secure Authentication & Access Control**:
   - Secure login and session management using HTTP-only, SameSite cookies and JWT.
   - Passwords hashed using `bcryptjs` with 12 salt rounds.
   - Rate-limiting on login endpoints to prevent brute-force attacks (`express-rate-limit`).
   - Server-side authorization verifying manager role on all protected mutations.
   - Public registration disabled; manager accounts initialized via an audited CLI seed script.

2. **Real-Time Financial Dashboard (`/dashboard`)**:
   - Instant calculation of 9 core financial metrics: Total Bazar Expenses, Fixed Utility Bills, Total Mess Costs, Total Meals Eaten, Current Meal Rate, Total Member Deposits, Total Unpaid Due Balances, Total Advance Receivables, and Active Members Count.
   - Visual charts powered by Recharts: Daily meal consumption trend, monthly expense distribution donut chart, and recent financial transactions.
   - Outstanding balances alert widget showing residents who owe money to the mess.
   - Month picker to navigate any past or current accounting period.

3. **Complete Member Directory (`/members`)**:
   - Add, edit, activate, and deactivate residents.
   - Soft deactivation preserves historical meal records, payments, and financial settlement history.
   - Search by name, phone number, and room number.
   - Individual monthly statements with one-click print-ready views.

4. **Convenient Daily Meal Management (`/meals`)**:
   - Bulk daily meal entry interface for Breakfast, Lunch, and Dinner.
   - Supports fractional meal quantities (e.g., 0.5 for half breakfast).
   - Live member-wise daily totals and grand daily aggregate calculation.
   - Bulk save operation with compound unique indexing (`messId + memberId + date`) preventing duplicate entries.
   - Monthly meal trends bar chart and member summary breakdown.

5. **Bazar & Fixed Expense Ledger (`/expenses`)**:
   - Categorized expenses: Bazar / Groceries, House rent, Electricity, Gas, Water, Wi-Fi, Cleaning, and Other.
   - **Crucial Distinction**: Supports both "Paid from Mess Cash Pool" and "Personally Paid by Member" (which automatically credits that resident's personal settlement balance without double-counting).
   - Receipt and memo URL tracking.

6. **Member Deposits & Audit Trail (`/payments`)**:
   - Record cash, bKash, Nagad, Rocket, and Bank Transfer deposits.
   - Non-destructive reversal of incorrect entries with mandatory audited reason logging.
   - Duplicate submission protection within 60-second windows.

7. **Backend Automatic Calculation Engine (`/calculations`)**:
   - Pure, testable calculation service (`calculationService.js`) using integer-paisa math to prevent IEEE-754 floating-point errors.
   - Safe division protecting against zero meals.
   - Deterministic remainder distribution ensuring member cost shares reconcile exactly to the total expense with 0 paisa loss.
   - Standardized sign convention:
     - **Positive balance (+)**: Member owes money to the mess (**Due**).
     - **Negative balance (-)**: Mess owes money to the member (**Receivable / Advance**).
     - **Zero balance (0)**: **Settled**.

8. **Monthly Reports & CSV Exports (`/reports`)**:
   - Category-wise expense breakdown, member meal totals, and master settlement statement.
   - Instant CSV export of monthly settlement records.
   - Clean printable view (`window.print()`) formatted for physical bulletin board posting.

9. **Mess Settings & Accounting Period Closes (`/settings`)**:
   - Mess profile configuration: Mess Name, Currency symbol (`৳ BDT`), and Address.
   - Monthly closing workflow: snapshots all balances, locks daily meals and financial transactions from modification.
   - Audited reopening requires documented reason logging.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router, JavaScript & JSX only), Tailwind CSS v4, Lucide React, Recharts, React Hot Toast.
- **Backend**: Node.js, Express.js, Helmet, CORS, Cookie-Parser, Morgan, Express-Rate-Limit.
- **Database**: MongoDB Atlas with Mongoose models, compound unique indexes, and schema validation.
- **Authentication**: JWT stored in secure HTTP-only cookies + bcryptjs password hashing.
- **Testing**: Native Node.js test runner with unit tests for edge-case calculation logic.

---

## 📁 Project Structure

```
smart-mess-management/
├── backend/
│   ├── scripts/
│   │   └── seedManager.js           # CLI manager & demo bachelor data initialization
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # Mongoose MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js    # Login, logout, getMe
│   │   │   ├── calculationController.js # Dashboard metrics, monthly calculations & reports
│   │   │   ├── expenseController.js # Bazar & fixed bills CRUD
│   │   │   ├── mealController.js    # Bulk daily meals entry & trends
│   │   │   ├── memberController.js  # Resident profiles & statements
│   │   │   ├── messController.js    # Mess settings, period close & reopen
│   │   │   └── paymentController.js # Member deposits & audited reversals
│   │   ├── middleware/
│   │   │   ├── auth.js              # Manager authentication verification
│   │   │   ├── errorHandler.js      # Centralized error handler
│   │   │   └── rateLimiter.js       # Rate limiter for auth endpoints
│   │   ├── models/
│   │   │   ├── AuditLog.js          # Sensitive financial action audit trails
│   │   │   ├── Expense.js           # Bazar and utility expense records
│   │   │   ├── MealEntry.js         # Daily breakfast, lunch, dinner counts
│   │   │   ├── Member.js            # Resident records & opening balances
│   │   │   ├── Mess.js              # Mess configuration & currency
│   │   │   ├── MonthlyPeriod.js     # Monthly closing snapshots & lock states
│   │   │   ├── Payment.js           # Deposits & reversal tracking
│   │   │   └── User.js              # Manager auth credentials
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── calculationService.js# Integer-paisa calculation engine
│   │   ├── tests/
│   │   │   ├── calculationService.test.js # Unit test suite
│   │   │   └── runTests.js          # Test runner
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── calculations/page.js     # Settlement ledger & calculation breakdown
│   │   ├── dashboard/page.js        # Main financial dashboard & charts
│   │   ├── expenses/page.js         # Bazar & fixed utilities management
│   │   ├── login/page.js            # Secure manager login page
│   │   ├── meals/page.js            # Daily bulk meal entry sheet & trends
│   │   ├── members/page.js          # Resident directory & statements
│   │   ├── payments/page.js         # Member deposit records & reversals
│   │   ├── reports/page.js          # Audit report & CSV/Print export
│   │   ├── settings/page.js         # Mess profile & monthly period lock
│   │   ├── globals.css              # Custom styling & print styles
│   │   ├── layout.js                # Root layout with Auth & Mess providers
│   │   └── page.js                  # Index redirect
│   ├── components/
│   │   ├── layout/                  # Sidebar, TopNavbar, AppLayout
│   │   ├── modals/                  # QuickMeal, AddExpense, AddPayment, AddMember, MemberStatement
│   │   └── ui/                      # Button, Card, Badge, Modal, Input, Skeleton, EmptyState, ConfirmDialog
│   ├── context/
│   │   ├── AuthContext.js           # Manager session state
│   │   └── MessContext.js           # Current month selector & quick action modals
│   ├── lib/
│   │   ├── api.js                   # Universal fetch client with credentials
│   │   └── utils.js                 # Currency (৳) & date formatters
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- A running MongoDB instance (Local MongoDB or MongoDB Atlas cluster)

### 1. Clone & Set Up Backend

```bash
cd backend
npm install
```

Create `.env` inside `backend/` (based on `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/smart_mess_db?retryWrites=true&w=majority
SESSION_SECRET=a_very_long_cryptographic_secret_key_minimum_32_characters
FRONTEND_URL=http://localhost:3000
```

### 2. Initialize the Manager Account & Sample Data

Run the seeding script to create the initial manager account. You can optionally pass `--sample-data` to seed realistic bachelor mess members, meals, and bills:

```bash
node scripts/seedManager.js --name "Mess Manager" --email "manager@mess.com" --password "ManagerPassword123!" --mess "Green View Bachelor Mess" --sample-data
```

### 3. Run Backend Server

```bash
npm run dev
# Server will start on http://localhost:5000
```

### 4. Set Up & Run Frontend

```bash
cd ../frontend
npm install --legacy-peer-deps
```

Create `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Run the Next.js development server:

```bash
npm run dev
# Frontend will be live on http://localhost:3000
```

---

## 🧮 Calculation Engine Formulas

The calculation logic is implemented in `backend/src/services/calculationService.js`:

1. **Meal-Cost Pool**:
   Expenses with category `bazar` or `groceries`.
   $$\text{Total Bazar Expense} = \sum \text{Bazar Expenses}$$

2. **Meal Rate**:
   $$\text{Meal Rate} = \begin{cases} \frac{\text{Total Bazar Expense}}{\text{Total Meals}}, & \text{if Total Meals} > 0 \\ 0, & \text{if Total Meals} = 0 \end{cases}$$
   *(If Bazar expenses exist with zero meals, the system safely sets rate to 0 and raises a prominent manager review banner).*

3. **Member Meal Cost**:
   $$\text{Member Meal Cost} = \text{Member's Total Meals} \times \text{Meal Rate}$$

4. **Fixed Utilities Distribution**:
   House Rent, Electricity, Gas, Water, Wi-Fi, Cleaning, and Other Fixed Bills are divided among eligible active residents using integer-paisa division. Any fractional paisa remainder is deterministically allocated 1 paisa at a time across members so that:
   $$\sum \text{Member Fixed Shares} \equiv \text{Total Fixed Expenses}$$

5. **Member Final Settlement Balance**:
   $$\text{Member Balance} = \text{Total Cost} - \text{Deposits} - \text{Personal Expense Payments} + \text{Opening Balance}$$
   - **Balance > 0**: Member owes money to the mess (**Due**).
   - **Balance < 0**: Mess owes money to the member (**Receivable / Advance**).
   - **Balance = 0**: Fully settled.

---

## 🧪 Testing Instructions

Run the calculation engine unit test suite:

```bash
cd backend
npm test
```

Expected output:
```
🧪 Starting Calculation Engine Unit Tests...

  ✅ PASS: Paisa conversion avoids floating point imprecision
  ✅ PASS: distributePaisaEqually reconciles remainder exactly with zero loss
  ✅ PASS: Zero meals with zero expenses produces rate 0 and no error
  ✅ PASS: Zero meals with bazar expense flags zero-meals warning and safe rate
  ✅ PASS: Fractional meals (e.g. 0.5, 1.5) calculate meal rate accurately
  ✅ PASS: Personal expense payment by member is credited exactly once in settlement
  ✅ PASS: Fixed costs distribute equally and settlement balances reconcile
  ✅ PASS: Member eligibility correctly respects join and leave dates

Results: 8 passed, 0 failed.
```

To verify the frontend build:

```bash
cd frontend
npm run build
```

---

## 🌐 API Documentation Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Manager login, returns cookie & token | No (Rate-limited) |
| `POST` | `/api/auth/logout` | Clears manager session cookie | No |
| `GET` | `/api/auth/me` | Fetches current manager profile | Yes |
| `GET` | `/api/calculations/dashboard?month=YYYY-MM` | Complete dashboard metrics, trends, and recent transactions | Yes |
| `GET` | `/api/calculations/monthly?month=YYYY-MM` | Full settlement calculation breakdown for month | Yes |
| `GET` | `/api/calculations/reports?month=YYYY-MM` | Monthly audit report data for export | Yes |
| `GET` | `/api/members` | List residents (supports `?active=` and `?search=`) | Yes |
| `POST` | `/api/members` | Add new resident | Yes |
| `PUT` | `/api/members/:id` | Update resident details | Yes |
| `PATCH` | `/api/members/:id/toggle-status` | Soft deactivate or reactivate member | Yes |
| `GET` | `/api/members/:id/statement?month=YYYY-MM` | Itemized monthly statement for member | Yes |
| `GET` | `/api/meals/daily?date=YYYY-MM-DD` | Attendance sheet for specified date | Yes |
| `POST` | `/api/meals/bulk` | Bulk save daily meals for all residents | Yes (Locked if month closed) |
| `GET` | `/api/meals/summary?month=YYYY-MM` | Monthly daily meal trend series | Yes |
| `GET` | `/api/expenses?month=YYYY-MM` | List expenses (filter by category, search) | Yes |
| `POST` | `/api/expenses` | Record bazar or fixed bill | Yes (Locked if month closed) |
| `DELETE` | `/api/expenses/:id` | Delete expense record with audit log | Yes (Locked if month closed) |
| `GET` | `/api/payments?month=YYYY-MM` | List member deposits | Yes |
| `POST` | `/api/payments` | Record member deposit | Yes (Locked if month closed) |
| `PATCH` | `/api/payments/:id/reverse` | Reverse deposit with mandatory audit reason | Yes (Locked if month closed) |
| `GET` | `/api/mess/settings` | Get mess profile and settings | Yes |
| `PUT` | `/api/mess/settings` | Update mess name, currency, address | Yes |
| `POST` | `/api/mess/close-period` | Finalize and lock monthly period | Yes |
| `POST` | `/api/mess/reopen-period` | Reopen period with audited reason | Yes |

---

## ☁️ Deployment Instructions

### Frontend (Vercel)
1. Push repository to GitHub/GitLab.
2. In Vercel, import the project and set the **Root Directory** to `frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed Express backend URL (e.g., `https://api.smartmess.yourdomain.com/api`).
4. Deploy.

### Backend (Railway / Render / DigitalOcean)
1. In hosting provider, connect repository and select `backend` as directory.
2. Set build command: `npm install` and start command: `node src/server.js`.
3. Configure environment variables:
   - `PORT`: `5000` (or platform default)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `SESSION_SECRET`: A secure 32+ character random string
   - `FRONTEND_URL`: Your deployed Vercel frontend URL (for CORS and credentials)
4. Initialize the manager on first run using the platform CLI / console:
   ```bash
   node scripts/seedManager.js --name "Manager Name" --email "manager@mess.com" --password "YourStrongPassword123!"
   ```

---

## 🔒 Security & Data Integrity Guarantees

- **No Public Signups**: Only managers initialized via server credentials can access the system.
- **Paisa-Level Precision**: All monetary operations are converted to integer cents/paisa during allocation to eliminate binary floating point drift.
- **Zero-Loss Remainder Distribution**: Fractional remainder paisa is distributed deterministically; sum of shares strictly equals total expenses.
- **Audit Trails**: Reversals, expense deletions, and period re-openings create immutable records in the `AuditLog` collection.
- **Soft Deactivation**: Historical meal entries and balances are permanently preserved when members move out.
