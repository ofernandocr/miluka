-- ============================================================
-- Migration: Shared default categories + user-specific custom
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Allow NULL user_id for shared defaults
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

-- 1. Insert default categories (user_id = NULL, visible to all)
INSERT INTO categories (user_id, name, icon, color, type) VALUES
  -- Expense categories
  (NULL, 'Food', '🍔', '#ef4444', 'expense'),
  (NULL, 'Transport', '🚗', '#f97316', 'expense'),
  (NULL, 'Housing', '🏠', '#eab308', 'expense'),
  (NULL, 'Utilities', '💡', '#06b6d4', 'expense'),
  (NULL, 'Health', '🏥', '#22c55e', 'expense'),
  (NULL, 'Entertainment', '🎬', '#8b5cf6', 'expense'),
  (NULL, 'Education', '📚', '#3b82f6', 'expense'),
  (NULL, 'Shopping', '🛒', '#ec4899', 'expense'),
  (NULL, 'Travel', '✈️', '#14b8a6', 'expense'),
  (NULL, 'Pets', '🐾', '#f97316', 'expense'),
  (NULL, 'Gifts', '🎁', '#ef4444', 'expense'),
  (NULL, 'Other', '📦', '#6b7280', 'expense'),
  -- Income categories
  (NULL, 'Salary', '💰', '#22c55e', 'income'),
  (NULL, 'Freelance', '💻', '#3b82f6', 'income'),
  (NULL, 'Investments', '📈', '#8b5cf6', 'income'),
  (NULL, 'Gifts', '🎁', '#ec4899', 'income'),
  (NULL, 'Other', '📦', '#6b7280', 'income')
ON CONFLICT DO NOTHING;

-- 2. Remove duplicate user-specific categories that match defaults
-- (skip those with transactions referencing them)
DELETE FROM categories
WHERE user_id IS NOT NULL
  AND name IN (SELECT name FROM categories WHERE user_id IS NULL)
  AND color IN (SELECT color FROM categories WHERE user_id IS NULL 
                AND categories.name = categories.name)
  AND type IN (SELECT type FROM categories WHERE user_id IS NULL 
               AND categories.name = categories.name)
  AND id NOT IN (SELECT category_id FROM transactions WHERE category_id IS NOT NULL);

-- 3. Update RLS policies
DROP POLICY IF EXISTS "Users can read own categories" ON categories;
DROP POLICY IF EXISTS "Users can create own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can read categories"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Simplify handle_new_user() trigger (no category seeding)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  INSERT INTO public.wallets (user_id, name, currency)
  VALUES (new.id, 'General', 'MXN');
  RETURN new;
END;
$$;
