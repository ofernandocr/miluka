-- ============================================================
-- Migration 011: Recurring Transactions
-- Run via psql or Supabase SQL Editor
-- ============================================================

-- Recurring transaction templates
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

-- Prevent duplicate templates (same user, category, wallet, frequency)
create unique index if not exists recurring_transactions_user_cat_wallet_freq_key
  on public.recurring_transactions (
    user_id,
    category_id,
    coalesce(wallet_id::text, ''),
    frequency
  );

-- Enable RLS
alter table public.recurring_transactions enable row level security;

-- RLS policies
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

-- Trigger: auto-update updated_at
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

-- Grant execute to authenticated users
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
