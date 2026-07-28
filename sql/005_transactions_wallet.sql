-- Migration: add wallet_id to transactions

-- Add column (safe to re-run, IF NOT EXISTS pattern)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'wallet_id'
  ) then
    alter table public.transactions add column wallet_id uuid references public.wallets(id) on delete set null;
  end if;
end $$;

-- Backfill: assign default wallet to existing transactions without a wallet
update public.transactions t
set wallet_id = (
  select w.id from public.wallets w
  where w.user_id = t.user_id
  order by w.created_at
  limit 1
)
where t.wallet_id is null;
