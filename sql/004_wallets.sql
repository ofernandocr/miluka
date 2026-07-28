-- Migration: add wallets table and default wallet creation

-- Wallets table (safe to re-run)
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

-- Enable RLS
alter table public.wallets enable row level security;

-- RLS policies
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

-- Update trigger function to also create default wallet
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

-- Backfill: create default wallet for existing profiles that don't have any wallet
insert into public.wallets (user_id, name, currency)
select p.id, 'General', 'MXN'
from public.profiles p
where not exists (
  select 1 from public.wallets w where w.user_id = p.id
)
on conflict (user_id, name) do nothing;
