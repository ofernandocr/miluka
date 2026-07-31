-- Default categories (shared for all users, user_id = NULL)
-- Run this after user signs up or manually via SQL Editor

-- Expense categories
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

-- Income categories
insert into public.categories (user_id, name, icon, color, type) values
  (NULL, 'Salary', '💰', '#22c55e', 'income'),
  (NULL, 'Freelance', '💻', '#3b82f6', 'income'),
  (NULL, 'Investments', '📈', '#8b5cf6', 'income'),
  (NULL, 'Gifts', '🎁', '#ec4899', 'income'),
  (NULL, 'Other', '📦', '#6b7280', 'income')
on conflict (user_id, name, type) do nothing;
