-- ============================================================
-- Migration: Add period support to budgets
-- Run this in Supabase SQL Editor or via psql
-- ============================================================

-- Add period columns (NULL = monthly default, NOT NULL = custom period)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS end_date DATE;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
