-- ============================================================
-- Migration 012: Allow multiple recurring templates distinguished by description
-- Run via psql or Supabase SQL Editor
-- ============================================================

-- The previous unique index (user, category, wallet, frequency) prevented
-- creating a second recurring template with the same category/frequency/wallet
-- even when the Detalle (description) differs. New index adds description so
-- the same category+frequency can coexist when the description differs.

drop index if exists public.recurring_transactions_user_cat_wallet_freq_key;

create unique index if not exists recurring_transactions_user_cat_wallet_freq_key
  on public.recurring_transactions (
    user_id,
    category_id,
    coalesce(wallet_id::text, ''),
    coalesce(description, ''),
    frequency
  );

-- Reload PostgREST schema cache so the constraint is reflected in the API
-- notify pgrst, 'reload schema';
