# Budgets — miLuka

## Overview
Budgets let users set monthly spending limits scoped to a **wallet** or a **category + wallet** combination. They power the progress bars on the Budgets page and the "budget-aware" spending list on the Dashboard.

## Data Model
- Table: `budgets` (`sql/009_budgets.sql`, period columns in `sql/010_budget_periods.sql`)
- Fields: `id`, `user_id`, `amount` (decimal > 0), `category_id` (nullable), `wallet_id` (nullable), `start_date` / `end_date` (nullable, added in `010`)
- Unique index: one budget per `(user_id, category_id, wallet_id)` combination — `COALESCE` treats NULLs as empty strings so wallet-only and category+wallet budgets don't collide
- RLS: users can only read/create/update/delete their own budgets
- Migration: `sql/009_budgets.sql` + `sql/010_budget_periods.sql`

## Types (`web/src/lib/types.ts`)
- `Budget` — row + optional joined `category` / `wallet`
- `NewBudget = Pick<Budget, "amount" | "category_id" | "wallet_id" | "start_date" | "end_date">`

## Data Flow
1. `useBudgets(userId)` (`web/src/hooks/useBudgets.ts`) loads budgets with joins `category:categories(*)` and `wallet:wallets(*)`, ordered by `created_at`. Exposes `createBudget`, `updateBudget`, `deleteBudget`; each mutation refetches.
2. Spent amount is computed client-side (never stored) via `computeBudgetSpent` in `web/src/lib/budgets.ts` — expense transactions within the budget's date range (or current month when no period is set) that match `category_id` and/or `wallet_id`.
3. The Dashboard merges budgets with the spending list via `buildUnifiedCategories` (`web/src/lib/dashboard.ts`) so each category row can show a budget bar with "left to spend" / "overspent" states.

## Pure Functions (`web/src/lib/budgets.ts`)
| Function | Purpose |
|----------|---------|
| `getBudgetDateRange(budget)` | Returns `{ start, end }` from `start_date`/`end_date`, or the current calendar month when unset |
| `computeBudgetSpent(budget, transactions)` | Sums matching expense transactions in the period |
| `getProgressColor(pct)` / `getProgressTextColor(pct)` | Color thresholds: `>100` red, `>85` orange, `>60` yellow, else green |
| `getPeriodLabel(budget)` | "July 2026" for monthly, "Jul 1 — Jul 31" range for custom periods |

These are covered by `web/src/lib/__tests__/budgets.test.ts` (19 tests).

## Components (`web/src/components/budgets/`)
- `BudgetForm` — two radio groups (Budget Type: By Wallet / Category + Wallet; Period: Monthly / Custom), wallet + category selects, monthly limit input. Submits `NewBudget` with nullable category/wallet and nullable period dates.
- `BudgetList` — groups budgets into "By Wallet" and "By Category + Wallet" cards. `BudgetCard` (wrapped in `React.memo`) renders the icon, name, period label, and an accessible progress bar (`role="progressbar"` with `aria-valuenow` / `aria-valuetext`). Colors and "X left" / "X over" text derive from the pure functions above.

## Page (`web/src/pages/Budgets.tsx`)
Wires `useBudgets` with `useCategories` / `useWallets`, hosts the create/edit dialog and delete confirmation, and passes spent values into `BudgetList`.

## Dashboard Integration
- `walletBudgets` map in `Dashboard.tsx` groups budgets by `wallet_id` and computes spent per budget with `computeBudgetSpent`.
- `buildUnifiedCategories(categoryData, budgetsForWallet, totalExpense)` attaches `budgetAmount` / `budgetPct` to category rows.
- `SpendingByCategoryList` shows a budget bar (green→yellow→orange→red by percent) with remaining/overspent subtitle instead of the plain % of total.