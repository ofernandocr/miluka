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
│   ├── 001_schema.sql        # Core tables: profiles, categories, transactions, wallets
│   ├── 002_rls.sql           # Row-level security policies
│   ├── 003_seed.sql          # Default categories for new users
│   ├── 004_wallets.sql       # Add wallets table + RLS + backfill
│   └── 005_transactions_wallet.sql  # Add wallet_id to transactions
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
    ├── tailwind.config.ts    # Tailwind CSS config
    ├── tsconfig.json         # TypeScript config
    └── src/
        ├── App.tsx           # Router setup
        ├── main.tsx          # Entry point
        ├── index.css         # Global styles (dark theme)
        ├── lib/
        │   ├── supabase.ts   # Supabase client (Kong URL)
        │   ├── types.ts      # TypeScript interfaces
        │   └── utils.ts      # cn(), formatCurrency(), CURRENCIES
        ├── hooks/
        │   ├── useAuth.ts    # Auth state (user, signIn, signUp, signOut)
        │   ├── useCategories.ts  # Category CRUD
        │   ├── useTransactions.ts # Transaction CRUD (+ category, wallet join)
        │   └── useWallets.ts  # Wallet CRUD
        ├── components/
        │   ├── layout/       # Navbar, ProtectedRoute
        │   ├── ui/           # shadcn/ui primitives (button, card, dialog, etc.)
        │   ├── categories/   # CategoryList, CategoryForm
        │   ├── transactions/ # TransactionList, TransactionForm, TransactionItem
        │   └── wallets/      # WalletList, WalletForm
        └── pages/            # Route pages (Login, Register, Dashboard, Transactions, Categories, Wallets)
```

## Data Model

### Tables

| Table         | Key Relationships                          | RLS | Notes |
|---------------|--------------------------------------------|-----|-------|
| `profiles`    | 1:1 with `auth.users`                      | Yes | User identity data |
| `wallets`     | N:1 profiles, 1:N transactions             | Yes | Each wallet has its own currency |
| `categories`  | N:1 profiles, 1:N transactions             | Yes | type: 'expense' or 'income' |
| `transactions`| N:1 profiles, N:1 wallets, N:1 categories  | Yes | wallet_id nullable (backfilled to default) |

### Key Constraints
- `wallets(user_id, name)` — unique wallet names per user
- `transactions.amount > 0` — positive amounts only
- `transactions.type IN ('expense', 'income')`

### Default Wallet
- Created automatically via trigger `on_auth_user_created`
- Name: "General", Currency: "MXN"

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
- Filtering (wallet, time range) done client-side via `useMemo`

## Testing

| Type | Tool | Location | Target |
|------|------|----------|--------|
| Component | Vitest + RTL | `src/__tests__/` | Rendering, interactions, edge cases |
| Hook | Vitest | `src/__tests__/` | All states (loading, empty, error, populated) |
| Integration | Vitest + test-db container | `src/__tests__/` | Real PostgreSQL queries |

## Future Phases

- Voice input (microphone) for transaction creation
- Currency exchange rate API for cross-wallet totals
- Bank notification detection on Android/iOS
- Offline support (PWA service worker)
