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

## 3. Dashboard

### 3.1 Wallet Filter
- By default: consolidated view of all wallets
- Dropdown/selector to filter by a specific wallet
- When filtered, only that wallet's transactions are shown

### 3.2 Time Range
- Toggle: "This month" / "All time"
- "This month" = current month (from 1st to today)
- "All time" = lifetime (no date filter)

### 3.3 Summary Cards
- Income (green) — total income in selected time range
- Expenses (red) — total expenses in selected time range
- Balance (green/red) — income minus expenses

Each amount displayed with its currency symbol. If multiple wallets visible, amounts grouped by currency.

### 3.4 Spending by Category (PieChart)
Shows expense breakdown by category for the selected wallet(s) and time range.

---

## 4. Bank Notification Detection (future phase)

### 4.1 Platforms
- Android: NotificationListenerService
- iOS: Notification Service Extension (limited)

### 4.2 Behavior
- Detect incoming notifications from known banking apps
- Parse amount, merchant, and date
- Create a draft transaction for user confirmation
- User must opt-in and grant notification access permission

---

## 5. Code Conventions

- All code, comments, commits, and docs in English
- Feature-by-feature commits: each feature is fully implemented and testable before moving to the next
- Each commit includes: schema migration (if needed) + frontend changes + tests
- Run `npm run lint` and `npm test` before every commit
