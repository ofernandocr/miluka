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
- The user's **default currency** (Settings → Preferences, stored in `profiles.currency`) is used as the fallback wherever a wallet does not specify a currency and as the pre-selected currency for new wallets

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
- Create mode (wizard) shows an optional "🔁 Make this a recurring template" checkbox inline on the final Date step; when enabled it reveals a frequency selector (Weekly/Monthly/Quarterly/Yearly) and a day-of-month selector (hidden for Weekly); on submit it creates both the transaction and a recurring template seeded from the same amount, type, description, category and wallet
- The recurring checkbox appears only in create mode and only when the page provides the `onCreateRecurring` callback; edit mode uses the classic form unchanged

### 2.3 Voice Input (future phase)
- Microphone button on transaction form
- User says: amount + category (e.g. "500 on food")
- App auto-fills: date = today, wallet = default wallet
- User reviews and confirms before saving

### 2.4 Transactions Page Filters
- Filter toolbar sits at the **top** of the page, all controls on one row at the same height
- **Search:** a magnifier icon (no always-visible search bar) — clicking it expands an input to type; an X closes it and clears the query
- **Income / Expenses:** two independent toggle buttons; tapping the active one clears it back to "All"; both on = All
- **Categories:** dropdown of all expense and income categories
- Clear button and filtered-result count appear only while a filter is active; deep-linkable via `?category=`, `?q=`, `?type=income|expense|income,expense`

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
- Horizontal scrollable `WalletCardsRow` showing all wallets as compact cards (SoftCard)
- Mobile: scroll-snap for centered selection; desktop (`lg:`) shows all cards in a flex row
- Selecting a card filters the chart to that wallet; `selectedSummary` drives the ring chart

### 4.2 Period Selector
- Single navigable period drives the entire dashboard (unified "one clock" model)
- `PeriodSelector`: chevrons (`‹`/`›`), month label, dropdown with native month input to jump, "This month" reset, and `[Month | All time]` segments
- Next-month chevron disabled at the current month; "All time" hides the chevrons
- Replaces the old binary `TimeRangeToggle`; the period is resolved against an arbitrary `{year, month}` (not just "now")

### 4.3 SpendingRingChart (Donut Chart)
- SVG donut chart replaces the old spending-by-category list
- Each slice represents a category's proportion of total spending
- Animated on mount (RAF-based sweep animation)
- Compact amounts displayed (e.g. "1.2k", "350")
- Clicking a slice navigates to `/transactions?category=<id>`
- Color-coded legend below the chart

### 4.4 Visual Design
- Light/Dark theme with system preference detection
- Collapsible sidebar (desktop) / bottom tab bar (mobile)
- No page H1 title — the top bar holds only the `PeriodSelector`
- **Soft-UI / Neumorphic design** for all custom components (SoftCard, SoftButton, SoftChip, etc.)
- CSS tokens: pastel purple palette (`--primary-h`, `--primary-s`, `--primary-l`) in HSL triplet format for use with `hsl(var(--x))` pattern
- Shadow tokens: `shadow-soft`, `shadow-soft-sm`, `shadow-soft-inset` for neumorphic depth
- Staggered list animations for transactions, categories, wallets, budgets
- Hover/tap effects on all interactive elements
- Monospace numbers (JetBrains Mono) for financial data

### 4.5 Upcoming Recurring
- Dashboard shows the 5 nearest active recurring templates ordered ascending by `next_due_date`; past-due active templates surface first with a "Due" badge
- Rendered as a compact card titled **"Upcoming"** (category icon, description as primary text, category name muted when a description exists, schedule subtitle, amount + next-due date) after the wallet summaries and before the QuickAddFAB
- "View all →" link navigates to `/recurring`
- Data loaded via `useRecurringTransactions` (same hook as /recurring); the auto-generation RPC (`generate_recurring_transactions()`) also runs on Dashboard load
- Frontend-only; no schema change

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
- Warning: wallet not found → transaction is assigned to the default (first) wallet instead of being dropped from the dashboard
- Error: category not found, invalid type, invalid amount, invalid date

### 6.3 Full Backup (JSON)
- Export all user data: transactions, categories, wallets, budgets, recurring templates
- JSON format with metadata (exported_at timestamp)

### 6.4 Settings Page (`/settings`)
- Accessible from the Navbar (desktop Sidebar footer and mobile bottom bar)
- Sections:
  - **Profile** — editable display name (inline edit with save/cancel), shows account email; the User ID is intentionally hidden
  - **Preferences** — selectable default currency (`profiles.currency`), used as the fallback currency and as the default for new wallets
  - **Manage** — links to Categories, Wallets, and Budgets (`/settings/categories`, `/settings/wallets`, `/settings/budgets`); these pages were moved out of the main navbar into Settings to keep it lean
  - **Appearance** — theme selector (Light / Dark / System)
  - **Data Management** — Import CSV, Export CSV, Export JSON

### 6.5 Forgot Password
- Login page has a "Forgot your password?" link below the form
- Opens a dialog prompting for email address
- Calls `supabase.auth.resetPasswordForEmail()` with a redirect back to `/settings`
- Shows success state after email is sent; user is instructed to check their inbox

### 6.6 Onboarding
- Shown once after first login (guarded by `miluka_onboarding_done` localStorage key)
- 4-slide dialog introducing: Welcome, Multiple Wallets, Categorize Expenses, Recurring Transactions
- Final slide includes an optional name input; saves to `profiles.full_name` via `ProfileProvider.setName()`
- Skip and Get started buttons; persists completion to localStorage on skip or completion

---

## 7. Recurring Transactions

### 7.1 Purpose
Let users define fixed recurring expenses (rent, subscriptions, utilities) that automatically generate real transactions each month.

### 7.2 Recurring Transactions Table
| Column           | Type          | Notes                                    |
|-----------------|---------------|------------------------------------------|
| id              | uuid          | PK, default gen_random_uuid()            |
| user_id         | uuid          | FK → profiles(id), NOT NULL              |
| wallet_id       | uuid          | FK → wallets(id), nullable               |
| category_id     | uuid          | FK → categories(id), NOT NULL            |
| amount          | decimal(12,2) | NOT NULL, check (amount > 0)             |
| description     | text          | nullable                                 |
| type            | text          | 'expense' or 'income'                    |
| frequency       | text          | 'weekly', 'monthly', 'quarterly', 'yearly' |
| day_of_month    | smallint      | 1-28, nullable (used for monthly+)       |
| next_due_date   | date          | NOT NULL — next generation date          |
| is_active       | boolean       | default true — pause/resume toggle       |
| last_generated_date | date      | nullable — prevents double-generation    |
| created_at      | timestamptz   | default now()                            |
| updated_at      | timestamptz   | auto-updated via trigger                 |

- Unique constraint: one template per user/category/wallet/frequency
- On creation, `next_due_date` is computed from the frequency: weekly = today + 7 days, monthly/quarterly/yearly = next occurrence of the day of month (clamped to 28)
- Recurring templates can also be created inline from the New Transaction wizard (final Date step, optional checkbox), seeding the template from the transaction's amount, type, description, category and wallet

### 7.3 Automation
- On app load, client calls `generate_recurring_transactions()` RPC
- RPC inserts real transactions for all templates where `next_due_date <= TODAY`
- After generation, `next_due_date` is advanced based on frequency
- Idempotent: `last_generated_date` prevents re-generation

### 7.4 UI
- Separate page `/recurring` with nav item in Sidebar and BottomNav
- RecurringForm: type, wallet, category, frequency, day of month, amount, description
- RecurringList: grouped by active/paused, shows schedule, next due date, amount
- RecurringOverdueBanner: warns when templates are past due
- Pause/resume toggle per template
- "+" per template opens a confirmation dialog (GenerateConfirmDialog) to review/edit amount and date before generating
- Main FAB (`QuickAddFab`) on Dashboard and Transactions shows a `+` icon when closed; when tapped, expands to a pill showing `+ New` and deploys an animated vertical stack of category shortcuts (top 4 most-used expense categories); each shortcut shows the category name to the left and a tinted circle with the icon to the right; backdrop blurs the background while the menu is open; a second tap on the FAB opens the full "New Transaction" form; selecting a category opens a minimal confirmation dialog requiring both amount and description; the menu has a focus trap (Tab cycles within buttons), Escape closes it, and `role="dialog"` + `aria-modal` ensure screen reader isolation

---

## 8. Bank Notification Detection (future phase)

### 8.1 Platforms
- Android: NotificationListenerService
- iOS: Notification Service Extension (limited)

### 8.2 Behavior
- Detect incoming notifications from known banking apps
- Parse amount, merchant, and date
- Create a draft transaction for user confirmation
- User must opt-in and grant notification access permission

---

## 9. Code Conventions

- All code, comments, commits, and docs in English
- Feature-by-feature commits: each feature is fully implemented and testable before moving to the next
- Each commit includes: schema migration (if needed) + frontend changes + tests
- Run `npm run lint` and `npm test` before every commit
- **Every project modification must include updating `sql/000_supabase_cloud_init.sql`** if the schema changes — this file is the source of truth for Supabase Cloud deployments

---

## 10. Deployment

### 10.1 Production Stack
- **Frontend:** Cloudflare Pages (static hosting, unlimited bandwidth, free SSL)
- **Backend:** Supabase Cloud (managed auth, REST API, PostgreSQL)
- **Mobile:** PWA (Progressive Web App — installable from browser)

### 10.2 Free Tier Limits
| Service | Limit |
|---------|-------|
| Supabase Cloud | 500MB DB, 50K MAU, 5GB bandwidth |
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month |

### 10.3 Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (e.g., `https://xyz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (public, safe for client)

### 10.4 PWA Requirements
- Icons: `web/public/icons/icon-192.png` and `icon-512.png`
- Manifest configured in `vite.config.ts`
- Auto-updating service worker via `vite-plugin-pwa`

See `DEPLOY.md` for full deployment instructions.
