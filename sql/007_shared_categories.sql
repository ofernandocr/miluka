-- ============================================================
-- Migration: Shared default categories + user-specific custom
-- Run this in Supabase SQL Editor (existing databases only)
-- ============================================================

-- 0. Allow NULL user_id for shared defaults
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

-- 1. Add unique constraint for ON CONFLICT support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_user_id_name_type_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_type_key
      UNIQUE (user_id, name, type);
  END IF;
END $$;

-- 2. Clean up duplicate user-specific categories that match defaults
DELETE FROM categories a
USING categories b
WHERE a.id > b.id
  AND a.user_id IS NULL
  AND b.user_id IS NULL
  AND a.name = b.name
  AND a.type = b.type;

-- 3. Remove user-specific categories that duplicate shared defaults
DELETE FROM categories
WHERE user_id IS NOT NULL
  AND name IN (SELECT name FROM categories WHERE user_id IS NULL)
  AND type IN (SELECT type FROM categories WHERE user_id IS NULL)
  AND id NOT IN (SELECT category_id FROM transactions WHERE category_id IS NOT NULL);

-- 4. Rename Food to Food & Drink
UPDATE categories SET name = 'Food & Drink' WHERE name = 'Food' AND user_id IS NULL;

-- 5. Add Groceries category
INSERT INTO categories (user_id, name, icon, color, type) VALUES
  (NULL, 'Groceries', '🛒', '#ec4899', 'expense')
ON CONFLICT (user_id, name, type) DO NOTHING;

-- 6. Update Shopping icon to shopping bag
UPDATE categories SET icon = '🛍️' WHERE name = 'Shopping' AND user_id IS NULL;

-- 7. Insert default categories (visible to all)
INSERT INTO categories (user_id, name, icon, color, type) VALUES
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
  (NULL, 'Other', '📦', '#6b7280', 'expense'),
  (NULL, 'Salary', '💰', '#22c55e', 'income'),
  (NULL, 'Freelance', '💻', '#3b82f6', 'income'),
  (NULL, 'Investments', '📈', '#8b5cf6', 'income'),
  (NULL, 'Gifts', '🎁', '#ec4899', 'income'),
  (NULL, 'Other', '📦', '#6b7280', 'income')
ON CONFLICT (user_id, name, type) DO NOTHING;

-- 8. Update RLS policies
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

-- 9. Simplify handle_new_user() trigger (no category seeding)
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
