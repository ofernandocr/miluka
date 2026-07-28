-- ============================================================
-- miLuka — Combined Migration for Supabase Cloud
-- Run this SINGLE script in the Supabase SQL Editor
-- ============================================================

-- 1. Create tables
-- ============================================================

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  currency text not null default 'MXN',
  created_at timestamptz not null default now()
);

-- Wallets table
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  currency text not null default 'MXN',
  icon text not null default '💼',
  color text not null default '#6b7280',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_wallets_user on public.wallets(user_id);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6b7280',
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_user on public.categories(user_id);

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount decimal(12,2) not null check (amount > 0),
  description text,
  date date not null default current_date,
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(user_id, date desc);

-- Auto-create profile and default wallet on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  insert into public.wallets (user_id, name, currency)
  values (new.id, 'General', 'MXN');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Enable Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- 3. RLS Policies — Profiles
-- ============================================================

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. RLS Policies — Wallets
-- ============================================================

create policy "Users can read own wallets"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "Users can create own wallets"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wallets"
  on public.wallets for update
  using (auth.uid() = user_id);

create policy "Users can delete own wallets"
  on public.wallets for delete
  using (auth.uid() = user_id);

-- 5. RLS Policies — Categories
-- ============================================================

create policy "Users can read own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- 6. RLS Policies — Transactions
-- ============================================================

create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- 7. Seed default categories (run AFTER user signs up)
-- ============================================================

-- Default expense categories
insert into public.categories (user_id, name, icon, color, type)
select
  id as user_id,
  cat.name,
  cat.icon,
  cat.color,
  cat.type
from auth.users
cross join (
  values
    ('Food', '🍔', '#ef4444', 'expense'),
    ('Transport', '🚗', '#f97316', 'expense'),
    ('Housing', '🏠', '#eab308', 'expense'),
    ('Utilities', '💡', '#06b6d4', 'expense'),
    ('Health', '🏥', '#22c55e', 'expense'),
    ('Entertainment', '🎬', '#8b5cf6', 'expense'),
    ('Education', '📚', '#3b82f6', 'expense'),
    ('Shopping', '🛒', '#ec4899', 'expense'),
    ('Travel', '✈️', '#14b8a6', 'expense'),
    ('Pets', '🐾', '#f97316', 'expense'),
    ('Gifts', '🎁', '#ef4444', 'expense'),
    ('Other', '📦', '#6b7280', 'expense')
) as cat(name, icon, color, type)
where not exists (
  select 1 from public.categories c
  where c.user_id = auth.users.id and c.name = cat.name and c.type = cat.type
);

-- Default income categories
insert into public.categories (user_id, name, icon, color, type)
select
  id as user_id,
  cat.name,
  cat.icon,
  cat.color,
  cat.type
from auth.users
cross join (
  values
    ('Salary', '💰', '#22c55e', 'income'),
    ('Freelance', '💻', '#3b82f6', 'income'),
    ('Investments', '📈', '#8b5cf6', 'income'),
    ('Gifts', '🎁', '#ec4899', 'income'),
    ('Other', '📦', '#6b7280', 'income')
) as cat(name, icon, color, type)
where not exists (
  select 1 from public.categories c
  where c.user_id = auth.users.id and c.name = cat.name and c.type = cat.type
);
