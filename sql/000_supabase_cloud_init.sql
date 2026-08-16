-- ============================================================
-- miLuka — Combined Migration for Supabase Cloud
-- Run this SINGLE script in the Supabase SQL Editor
-- Fully idempotent: safe to re-run on existing databases
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
-- user_id IS NULL for shared defaults, set for user-specific custom categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6b7280',
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
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

-- Budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount decimal(12,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  wallet_id uuid references public.wallets(id) on delete set null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create unique index if not exists budgets_user_cat_wallet_key
  on public.budgets (user_id, coalesce(category_id::text, ''), coalesce(wallet_id::text, ''));

create index if not exists idx_budgets_user on public.budgets(user_id);

-- Recurring transactions table
create table if not exists public.recurring_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  wallet_id    uuid references public.wallets(id) on delete set null,
  category_id  uuid not null references public.categories(id) on delete restrict,
  amount       decimal(12,2) not null check (amount > 0),
  description  text,
  type         text not null check (type in ('expense', 'income')),
  frequency    text not null check (frequency in ('weekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month smallint check (day_of_month between 1 and 28),
  next_due_date date not null,
  is_active    boolean not null default true,
  last_generated_date date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_recurring_user_active
  on public.recurring_transactions(user_id, is_active, next_due_date);

create unique index if not exists recurring_transactions_user_cat_wallet_freq_key
  on public.recurring_transactions (
    user_id,
    category_id,
    coalesce(wallet_id::text, ''),
    frequency
  );

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
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;

-- 3. RLS Policies — Profiles
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. RLS Policies — Wallets
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read own wallets"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own wallets"
    ON public.wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own wallets"
    ON public.wallets FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own wallets"
    ON public.wallets FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. RLS Policies — Categories (shared defaults + user-specific)
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. RLS Policies — Transactions
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. RLS Policies — Budgets
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. RLS Policies — Recurring Transactions
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "Users can read own recurring transactions"
    ON public.recurring_transactions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own recurring transactions"
    ON public.recurring_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own recurring transactions"
    ON public.recurring_transactions FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own recurring transactions"
    ON public.recurring_transactions FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. Seed default categories (shared for all users)
-- ============================================================

-- Expense categories (13)
insert into public.categories (user_id, name, icon, color, type) values
  (NULL, 'Food & Drink', '🍔', '#ef4444', 'expense'),
  (NULL, 'Transport', '🚗', '#f97316', 'expense'),
  (NULL, 'Housing', '🏠', '#eab308', 'expense'),
  (NULL, 'Utilities', '💡', '#06b6d4', 'expense'),
  (NULL, 'Health', '🏥', '#22c55e', 'expense'),
  (NULL, 'Entertainment', '🎬', '#8b5cf6', 'expense'),
  (NULL, 'Education', '📚', '#3b82f6', 'expense'),
  (NULL, 'Groceries', '🛒', '#ec4899', 'expense'),
  (NULL, 'Shopping', '🛍️', '#ec4899', 'expense'),
  (NULL, 'Travel', '✈️', '#14b8a6', 'expense'),
  (NULL, 'Pets', '🐾', '#f97316', 'expense'),
  (NULL, 'Gifts', '🎁', '#ef4444', 'expense'),
  (NULL, 'Other', '📦', '#6b7280', 'expense')
on conflict (user_id, name, type) do nothing;

-- Income categories (5)
insert into public.categories (user_id, name, icon, color, type) values
  (NULL, 'Salary', '💰', '#22c55e', 'income'),
  (NULL, 'Freelance', '💻', '#3b82f6', 'income'),
  (NULL, 'Investments', '📈', '#8b5cf6', 'income'),
  (NULL, 'Gifts', '🎁', '#ec4899', 'income'),
  (NULL, 'Other', '📦', '#6b7280', 'income')
on conflict (user_id, name, type) do nothing;

-- Auto-update updated_at for recurring_transactions
create or replace function public.update_recurring_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger recurring_transactions_updated
  before update on public.recurring_transactions
  for each row execute function public.update_recurring_timestamp();

-- RPC: Generate transactions from recurring templates
create or replace function public.generate_recurring_transactions()
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  rec record;
  generated_count integer := 0;
  new_next date;
begin
  for rec in
    select id, user_id, wallet_id, category_id, amount, description, type,
           frequency, day_of_month, next_due_date
    from public.recurring_transactions
    where user_id = auth.uid()
      and is_active = true
      and next_due_date <= CURRENT_DATE
  loop
    insert into public.transactions (user_id, wallet_id, category_id, amount, description, date, type)
    values (rec.user_id, rec.wallet_id, rec.category_id, rec.amount, rec.description, rec.next_due_date, rec.type);

    case rec.frequency
      when 'weekly' then
        new_next := rec.next_due_date + 7;
      when 'monthly' then
        new_next := rec.next_due_date + interval '1 month';
        if rec.day_of_month is not null then
          new_next := make_date(
            extract(year from new_next)::int,
            extract(month from new_next)::int,
            least(rec.day_of_month, 28)
          );
        end if;
      when 'quarterly' then
        new_next := rec.next_due_date + interval '3 months';
        if rec.day_of_month is not null then
          new_next := make_date(
            extract(year from new_next)::int,
            extract(month from new_next)::int,
            least(rec.day_of_month, 28)
          );
        end if;
      when 'yearly' then
        new_next := rec.next_due_date + interval '1 year';
      else
        new_next := rec.next_due_date + interval '1 month';
    end case;

    update public.recurring_transactions
    set next_due_date = new_next,
        last_generated_date = CURRENT_DATE
    where id = rec.id;

    generated_count := generated_count + 1;
  end loop;

  return generated_count;
end;
$$;

grant execute on function public.generate_recurring_transactions() to authenticated;

-- RPC: Generate a single transaction from a specific recurring template
create or replace function public.generate_recurring_transaction(p_recurring_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  rec record;
  new_next date;
begin
  select * into rec
  from public.recurring_transactions
  where id = p_recurring_id
    and user_id = auth.uid()
    and is_active = true;

  if not found then return; end if;

  insert into public.transactions (user_id, wallet_id, category_id, amount, description, date, type)
  values (rec.user_id, rec.wallet_id, rec.category_id, rec.amount, rec.description, CURRENT_DATE, rec.type);

  case rec.frequency
    when 'weekly' then
      new_next := rec.next_due_date + 7;
    when 'monthly' then
      new_next := rec.next_due_date + interval '1 month';
      if rec.day_of_month is not null then
        new_next := make_date(
          extract(year from new_next)::int,
          extract(month from new_next)::int,
          least(rec.day_of_month, 28)
        );
      end if;
    when 'quarterly' then
      new_next := rec.next_due_date + interval '3 months';
      if rec.day_of_month is not null then
        new_next := make_date(
          extract(year from new_next)::int,
          extract(month from new_next)::int,
          least(rec.day_of_month, 28)
        );
      end if;
    when 'yearly' then
      new_next := rec.next_due_date + interval '1 year';
    else
      new_next := rec.next_due_date + interval '1 month';
  end case;

  update public.recurring_transactions
  set next_due_date = new_next,
      last_generated_date = CURRENT_DATE
  where id = p_recurring_id;
end;
$$;

grant execute on function public.generate_recurring_transaction(uuid) to authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
