-- ============================================================
-- Migration: Budgets table
-- Run this in Supabase SQL Editor or via psql
-- ============================================================

-- Budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount decimal(12,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  wallet_id uuid references public.wallets(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Unique constraint: one budget per user/category/wallet combination
-- Uses COALESCE to treat NULLs as empty strings for uniqueness
create unique index if not exists budgets_user_cat_wallet_key
  on public.budgets (user_id, coalesce(category_id::text, ''), coalesce(wallet_id::text, ''));

create index if not exists idx_budgets_user on public.budgets(user_id);

-- Enable RLS
alter table public.budgets enable row level security;

-- RLS policies
create policy "Users can read own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can create own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
