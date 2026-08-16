# miLuka — Architecture

## Project Structure

```
miluka/
├── docker-compose.yml        # Service orchestration (7 + 1 services)
├── .env                      # Environment variables (dev defaults)
├── AGENTS.md                 # Agent instructions (start here)
├── REQUIREMENTS.md           # Feature requirements
├── ARCHITECTURE.md           # This file — architecture reference
│
├── sql/                      # Database migrations (applied via psql)
│   ├── 000_supabase_cloud_init.sql  # Combined migration for Supabase Cloud (idempotent)
│   ├── 001_schema.sql        # Core tables: profiles, categories, transactions, wallets
│   ├── 002_rls.sql           # Row-level security policies
│   ├── 003_seed.sql          # Default categories for new users
│   ├── 004_wallets.sql       # Add wallets table + RLS + backfill
│   ├── 005_transactions_wallet.sql  # Add wallet_id to transactions
│   ├── 006_search.sql        # Add search index on transactions
│   ├── 007_shared_categories.sql    # Shared categories model (user_id=NULL defaults)
│   ├── 008_seed_transactions.sql    # Idempotent seed script for test data
│   ├── 009_budgets.sql       # Budgets table + RLS + unique constraint
│   ├── 010_budget_periods.sql # Add start_date, end_date to budgets
│   └── 011_recurring_transactions.sql # Recurring templates + RPC generation
│
├── supabase/                 # Supabase service configs
│   ├── kong.yml              # API gateway routes
│   └── kong-entrypoint.sh    # Env var substitution for kong.yml
│
├── volumes/db/               # DB init scripts (Docker entrypoint)
│   ├── roles.sql             # PostgreSQL roles (anon, authenticated, etc.)
│   └── jwt.sql               # JWT verification function
│
└── web/                      # React frontend
    ├── Dockerfile.dev        # Node 20 dev container
    ├── vite.config.ts        # Vite + Vitest config
    ├── tailwind.config.ts    # Tailwind CSS config (Inter + JetBrains Mono, surface tokens, shadows)
    ├── tsconfig.json         # TypeScript config
    └── src/
        ├── App.tsx           # Router + responsive layout (Sidebar desktop / BottomNav mobile)
        ├── main.tsx          # Entry point
        ├── index.css         # Global styles (Light + Dark themes, surface tokens, transitions)
        ├── lib/
        │   ├── supabase.ts   # Supabase client (Kong URL)
        │   ├── types.ts      # TypeScript interfaces
        │   ├── csv.ts        # CSV import/export logic (papaparse)
        │   └── utils.ts      # cn(), formatCurrency(), CURRENCIES
        ├── hooks/
        │   ├── useAuth.ts    # Auth state (user, signIn, signUp, signOut)
        │   ├── useBudgets.ts # Budget CRUD (+ category, wallet join)
        │   ├── useCategories.ts  # Category CRUD
        │   ├── useRecurringTransactions.ts # Recurring CRUD + auto-generation
        │   ├── useTheme.ts   # Theme management (system/light/dark, localStorage)
        │   ├── useTransactions.ts # Transaction CRUD (+ category, wallet join)
        │   └── useWallets.ts  # Wallet CRUD
        ├── components/
        │   ├── layout/       # Sidebar, BottomNav, ProtectedRoute
        │   ├── ui/           # shadcn/ui primitives (button, card, dialog, ThemeToggle, FloatingActionButton)
        │   ├── budgets/      # BudgetForm, BudgetList
        │   ├── recurring/    # RecurringForm, RecurringList, RecurringOverdueBanner
        │   ├── categories/   # CategoryList, CategoryForm
        │   ├── transactions/ # TransactionList, TransactionForm, TransactionItem, CsvImportDialog
        │   ├── exports/      # ExportSection (CSV/JSON export)
        │   └── wallets/      # WalletList, WalletForm
        └── pages/            # Route pages (Login, Register, Dashboard, Transactions, Categories, Wallets, Budgets, Recurring, Settings)
```

## Data Model

### Tables

| Table         | Key Relationships                          | RLS | Notes |
|---------------|--------------------------------------------|-----|-------|
| `profiles`    | 1:1 with `auth.users`                      | Yes | User identity data |
| `wallets`     | N:1 profiles, 1:N transactions             | Yes | Each wallet has its own currency |
| `categories`  | N:1 profiles (nullable), 1:N transactions  | Yes | Shared defaults (user_id=NULL) + user-specific |
| `transactions`| N:1 profiles, N:1 wallets, N:1 categories  | Yes | wallet_id nullable (backfilled to default) |
| `budgets`     | N:1 profiles, N:1 wallets, N:1 categories  | Yes | Period: monthly (NULL dates) or custom (start/end) |
| `recurring_transactions` | N:1 profiles, N:1 wallets, N:1 categories | Yes | Templates for auto-generated transactions |

### Key Constraints
- `wallets(user_id, name)` — unique wallet names per user
- `transactions.amount > 0` — positive amounts only
- `transactions.type IN ('expense', 'income')`
- `budgets(user_id, COALESCE(category_id,''), COALESCE(wallet_id,''))` — one budget per user/category/wallet combination
- `recurring_transactions(user_id, category_id, COALESCE(wallet_id,''), frequency)` — one template per user/category/wallet/frequency
- `profiles.currency` is kept for backwards compatibility; wallets table is the source of truth for transaction currency

### Default Wallet
- Created automatically via trigger `on_auth_user_created`
- Name: "General", Currency: "MXN"

### Categories Model (Shared Defaults)
- **Default categories** have `user_id = NULL` — visible to all users, cannot be modified
- **Custom categories** have `user_id = <uuid>` — private to the user who created them
- Users see all defaults + their own custom categories
- RLS ensures users can only INSERT/UPDATE/DELETE their own categories
- 18 default categories: 13 expense + 5 income (defined in `sql/000_supabase_cloud_init.sql`)
- No category seeding on signup — defaults are global, not per-user

## Auth Flow

```
Browser ──POST──> Kong (:8000/auth/v1/) ──strip_path──> GoTrue (:9999/)
Browser ──GET───> Kong (:8000/rest/v1/) ───strip_path──> PostgREST (:3000/)
```

- GoTrue signs JWT with `GOTRUE_JWT_SECRET` (same as `JWT_SECRET`)
- JWT payload includes `aud: "authenticated"` (mapped to DB role via `PGRST_JWT_ROLE_CLAIM_KEY: ."aud"`)
- PostgREST connects as `authenticator`, switches to `authenticated` role
- RLS uses `auth.uid()` from JWT `sub` claim via `request.jwt.claims` GUC

## API Access

- `Authorization: Bearer <jwt>` — authenticated user
- `apikey: <anon_key>` — anonymous (limited by RLS)
- `curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/rest/v1/transactions`

## State Management

- No global state store (Redux, Zustand, etc.)
- Each page uses hooks directly (useAuth, useTransactions, useCategories, useWallets)
- Data flows: Page → Hooks → Supabase client → Kong → PostgREST → PostgreSQL
- Filtering (wallet, time range) done client-side via `useMemo` in the Dashboard component
  - `filterByTimeRange(transactions, timeRange)` — filters by current month
  - `computeWalletSummaries(transactions, wallets)` — groups transactions per wallet, computes income/expense/categoryData per wallet
  - `computeCategoryData(transactions)` — aggregates expense amounts by category for a single wallet's transactions

## Design System

### Theme Support
- **Light mode** (default) + **Dark mode** via CSS variables
- Theme persisted in `localStorage`, system preference detected on first visit
- Anti-flash script in `index.html` prevents white flash on load
- Smooth transitions via CSS `transition: background-color 0.3s, color 0.3s`

### Typography
- **UI:** Inter (Google Fonts) — clean, legible at all sizes
- **Monospace/Numbers:** JetBrains Mono — tabular figures for financial data
- Font loaded via Google Fonts with `display=swap` for performance

### Color System
- Semantic tokens: `positive` (green), `negative` (red), `caution` (amber)
- Surface hierarchy: `base` → `raised` → `overlay` with color-tinted shadows
- Shadow tokens: `shadow-card`, `shadow-elevated`, `shadow-float`
- All colors defined as CSS variables in `index.css` with dark mode overrides

### Navigation
- **Desktop (≥1024px):** Collapsible sidebar (240px expanded / 64px collapsed)
- **Mobile (<1024px):** Bottom tab bar + floating action button (FAB)
- FAB (`QuickAddFab`) opens a quick-add menu with the top 4 most-used expense categories (icons only) and a "New Transaction" option to open the full form; available on all screen sizes
- Sidebar persists state in `localStorage`

### Animations
- `motion` library (Framer Motion v11) for stagger, layout, and gesture animations
- Staggered list entries (0.03-0.06s delay per item)
- Hover/tap effects on cards and interactive elements
- `prefers-reduced-motion` media query respected for accessibility

## Formatting Utilities (`web/src/lib/utils.ts`)

- `formatCurrency(amount, currency = "MXN")` — uses `Intl.NumberFormat` for locale-aware display
- `getCurrencySymbol(code)` — returns symbol from the `CURRENCIES` constant (e.g. "MX$", "$", "€")
- `CURRENCIES` — array of 9 supported currencies: MXN, USD, EUR, CAD, GBP, BRL, COP, ARS, UYU
- `formatDate(date)` — formats ISO date string to human-readable (e.g. "Jul 26, 2026")

## Dashboard Filtering

The Dashboard uses per-wallet data isolation. When "All wallets" is selected, each wallet gets its own section with summary cards and a unified spending list:

1. `filterByTimeRange(tx, timeRange)` — filters transactions by current month
2. `computeWalletSummaries(tx, wallets)` — returns `[{ wallet, income, expense, categoryData }]` per wallet
3. `computeCategoryData(tx)` — returns `[{ id, name, icon, value, color }]` for a single wallet's expenses
4. `buildUnifiedCategories(categoryData, budgets, totalExpense)` — merges budget data with spending data into a single list

Each wallet section displays:
- Wallet header (icon, name, currency)
- Summary cards (Income, Expenses, Balance)
- Unified spending list:
  - Categories with budget: budget progress bar (spent/budget) with color coding (green/yellow/orange/red)
  - Categories without budget: percentage of total spending bar using category color
  - Sorted highest to lowest by amount
  - "Manage budgets →" link at bottom (only when budgets exist)

When a specific wallet is selected via dropdown, only that wallet's section is shown.

Transactions page supports URL-based filters via `useSearchParams`: `?category=<id>` and `?type=<expense|income>`.

## Testing

| Type | Tool | Location | Target |
|------|------|----------|--------|
| Component | Vitest + RTL | `src/__tests__/` | Rendering, interactions, edge cases |
| Hook | Vitest | `src/__tests__/` | All states (loading, empty, error, populated) |
| Integration | Vitest + test-db container | `src/__tests__/` | Real PostgreSQL queries |

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  React SPA (static files)                           │ │
│  │  - index.html, JS bundle, CSS                       │ │
│  │  - PWA service worker                               │ │
│  │  - Icons (192x192, 512x512)                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Environment Variables:                                   │
│  - VITE_SUPABASE_URL=https://xyz.supabase.co             │
│  - VITE_SUPABASE_ANON_KEY=eyJhbG...                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    Supabase Cloud                         │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Kong API Gateway (managed)                         │ │
│  │  ├── /auth/v1/* → GoTrue (Auth)                     │ │
│  │  └── /rest/v1/* → PostgREST (REST API)              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                │ │
│  │  - profiles, wallets, categories, transactions      │ │
│  │  - Row Level Security (RLS)                         │ │
│  │  - Auto-created wallet trigger                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Free Tier: 500MB DB, 50K MAU, 5GB bandwidth            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow (Production)

```
Mobile/Web Browser
       │
       ▼
Cloudflare Pages (static files, CDN)
       │
       ▼ HTTPS
Supabase Cloud (Kong → GoTrue/PostgREST → PostgreSQL)
```

### Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Build-time (client) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Build-time (client) | Supabase anonymous key (public) |

### PWA Configuration

- Manifest: `vite.config.ts` → `VitePWA` plugin
- Icons: `web/public/icons/` (192x192, 512x512 PNG)
- Service Worker: Auto-generated by `vite-plugin-pwa`
- Install: Browser prompts "Add to Home Screen"

See `DEPLOY.md` for full deployment instructions.

## Future Phases

- Voice input (microphone) for transaction creation
- Currency exchange rate API for cross-wallet totals
- Bank notification detection on Android/iOS
- Offline support (PWA service worker)

## Recurring Transactions

### Automation Strategy
- Client-side RPC on app load: `generate_recurring_transactions()`
- Checks for templates with `next_due_date <= TODAY`
- Generates real transactions in the `transactions` table
- Updates `next_due_date` and `last_generated_date` on each template
- Idempotent: `last_generated_date` prevents double-generation

### Frequency Support
- Weekly, Monthly, Quarterly, Yearly
- `day_of_month` (1-28) for monthly/quarterly/yearly — capped at 28 to avoid Feb edge cases
- Weekly ignores `day_of_month`

### UI Location
- Separate page `/recurring` with its own nav item
- Overdue banner on page load when templates are past due
- Pause/resume toggle per template
- "+" per template opens a confirmation dialog to review/edit the amount and date before generating
- Top 4 most-used expense categories are surfaced as icon-only quick-add shortcuts on the main FAB (Dashboard and Transactions pages), where the user only enters the amount
