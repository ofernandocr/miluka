# miLuka — Requirements

## 1. Currency & Wallets

### 1.1 Model
- `profiles` remains as user identity data (name, avatar, created_at), linked 1:1 to `auth.users`
- New `wallets` table — each user can have multiple wallets, each with its own currency
- Currencies never mix inside a single wallet; the wallet defines the currency for all its transactions

### 1.2 Wallets Table
| Column     | Type         | Notes                              |
|-----------|--------------|------------------------------------|
| id        | uuid         | PK, default gen_random_uuid()      |
| user_id   | uuid         | FK → profiles(id), NOT NULL        |
| name      | text         | NOT NULL (e.g. "Cash", "Savings")  |
| currency  | text         | NOT NULL (e.g. "MXN", "USD")       |
| icon      | text         | default "💼"                        |
| color     | text         | default "#6b7280"                   |
| created_at| timestamptz  | default now()                       |

- Unique constraint: (user_id, name) — no duplicate wallet names per user
- Default wallet created on signup (name: "General", currency: "MXN")

### 1.3 Supported Currencies (initial)
MXN, USD, EUR, CAD, GBP, BRL, COP, ARS, UYU — defined in `web/src/lib/utils.ts`.

### 1.4 Exchange Rate (future phase)
Public API on-demand conversion, user-initiated. No automatic conversion.

---

## 2. Transactions

### 2.1 Current Model (extended)
Add `wallet_id` to the existing `transactions` table:
| Column      | Current | New      |
|-------------|---------|----------|
| wallet_id   | —       | uuid, FK → wallets(id), nullable |

- `wallet_id` is optional; if not provided, the default wallet is assigned
- The wallet determines the transaction currency
- RLS enforced: user can only assign their own wallets

### 2.2 TransactionForm Update
- Add wallet selector (dropdown) with the default wallet pre-selected
- If user has only one wallet, selector is hidden
- Currency indicator shown next to the amount field (e.g. "$" or "MX$")

### 2.3 Voice Input (future phase)
- Microphone button on transaction form
- User says: amount + category (e.g. "500 on food")
- App auto-fills: date = today, wallet = default wallet
- User reviews and confirms before saving

---

## 3. Categories

### 3.1 Shared Defaults Model
- **Default categories** have `user_id = NULL` — visible to all users globally
- **Custom categories** have `user_id = <uuid>` — private to the user who created them
- Users see all default categories + their own custom categories
- Default categories cannot be edited or deleted by users
- Custom categories can be fully managed (CRUD) by their owner

### 3.2 Default Categories (18 total)
**Expense (13):** Food & Drink, Transport, Housing, Utilities, Health, Entertainment, Education, Groceries, Shopping, Travel, Pets, Gifts, Other

**Income (5):** Salary, Freelance, Investments, Gifts, Other

### 3.3 Custom Categories
- Users can create additional categories for their specific needs
- Custom categories have: name, icon, color, type (expense/income)
- Only visible to the user who created them (enforced via RLS)

---

## 4. Dashboard

### 4.1 Wallet Filter
- By default: consolidated view of all wallets
- Dropdown/selector to filter by a specific wallet
- When filtered, only that wallet's transactions are shown

### 4.2 Time Range
- Toggle: "This month" / "All time"
- "This month" = current month (from 1st to today)
- "All time" = lifetime (no date filter)

### 4.3 Summary Cards
- Income (green) — total income in selected time range
- Expenses (red) — total expenses in selected time range
- Balance (green/red) — income minus expenses

Each amount displayed with its currency symbol. If multiple wallets visible, amounts grouped by currency.

### 4.4 Spending by Category (Unified List)
Shows expense breakdown by category for the selected wallet(s) and time range. Merges budget data with spending data:

- Categories with budget: budget progress bar (spent/budget) with color coding
- Categories without budget: percentage of total spending bar
- Sorted highest to lowest by amount
- "Manage budgets →" link at bottom (only when budgets exist)

### 4.5 Visual Design
- Light/Dark theme with system preference detection
- Collapsible sidebar (desktop) / bottom tab bar (mobile)
- Staggered list animations for transactions, categories, wallets, budgets
- Hover/tap effects on all interactive elements
- Monospace numbers (JetBrains Mono) for financial data

---

## 5. Budgets

### 5.1 Budget Types
Two budget types, both requiring a wallet:
- **By Wallet:** Budget for the entire wallet (no category filter)
- **Category + Wallet:** Budget for a specific category within a wallet

### 5.2 Budget Periods
- **Monthly (default):** Repeats every month, uses current month for date range
- **Custom:** User defines start_date and end_date for one-time or irregular periods

### 5.3 Budget Table
| Column      | Type         | Notes                              |
|------------|--------------|------------------------------------|
| id         | uuid         | PK, default gen_random_uuid()      |
| user_id    | uuid         | FK → profiles(id), NOT NULL        |
| amount     | decimal(12,2)| NOT NULL, check (amount > 0)       |
| category_id| uuid         | FK → categories(id), nullable      |
| wallet_id  | uuid         | FK → wallets(id), nullable         |
| start_date | date         | NULL for monthly, set for custom   |
| end_date   | date         | NULL for monthly, set for custom   |
| created_at | timestamptz  | default now()                      |

- Unique constraint: one budget per user/category/wallet combination
- Budget shown in Dashboard as part of unified spending list

---

## 6. Data Import / Export

### 6.1 CSV Export
- Export all transactions as CSV with human-readable columns: date, type, amount, description, category (name), wallet (name), currency, id
- Download triggered from Settings page

### 6.2 CSV Import
- Upload CSV file with transaction data
- Name-based resolution: category name → category_id, wallet name → wallet_id
- Flexible date parsing: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, and natural language
- Validation: type (expense/income), amount (>0), category (required, must exist), date (valid)
- Duplicate detection: if CSV row has `id` column matching existing transaction → skip
- Import flow: Upload → Preview (valid/warning/error rows) → Confirm → Summary
- Warning: wallet not found → saved without wallet
- Error: category not found, invalid type, invalid amount, invalid date

### 6.3 Full Backup (JSON)
- Export all user data: transactions, categories, wallets, budgets
- JSON format with metadata (exported_at timestamp)

### 6.4 Settings Page (`/settings`)
- Accessible from user dropdown menu in Navbar
- Sections: Profile, Data Management (Import CSV, Export CSV, Export JSON)

---

## 7. Bank Notification Detection (future phase)

### 7.1 Platforms
- Android: NotificationListenerService
- iOS: Notification Service Extension (limited)

### 7.2 Behavior
- Detect incoming notifications from known banking apps
- Parse amount, merchant, and date
- Create a draft transaction for user confirmation
- User must opt-in and grant notification access permission

---

## 8. Code Conventions

- All code, comments, commits, and docs in English
- Feature-by-feature commits: each feature is fully implemented and testable before moving to the next
- Each commit includes: schema migration (if needed) + frontend changes + tests
- Run `npm run lint` and `npm test` before every commit
- **Every project modification must include updating `sql/000_supabase_cloud_init.sql`** if the schema changes — this file is the source of truth for Supabase Cloud deployments

---

## 9. Deployment

### 9.1 Production Stack
- **Frontend:** Cloudflare Pages (static hosting, unlimited bandwidth, free SSL)
- **Backend:** Supabase Cloud (managed auth, REST API, PostgreSQL)
- **Mobile:** PWA (Progressive Web App — installable from browser)

### 9.2 Free Tier Limits
| Service | Limit |
|---------|-------|
| Supabase Cloud | 500MB DB, 50K MAU, 5GB bandwidth |
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month |

### 9.3 Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (e.g., `https://xyz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (public, safe for client)

### 9.4 PWA Requirements
- Icons: `web/public/icons/icon-192.png` and `icon-512.png`
- Manifest configured in `vite.config.ts`
- Auto-updating service worker via `vite-plugin-pwa`

See `DEPLOY.md` for full deployment instructions.
