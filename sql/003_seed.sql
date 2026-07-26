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
