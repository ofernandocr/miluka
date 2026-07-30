-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Profiles: users can read/update their own profile only
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Categories: users can read shared defaults + their own custom categories
create policy "Users can read categories"
  on public.categories for select
  using (user_id IS NULL OR auth.uid() = user_id);

-- Categories: users can only create/edit/delete their own custom categories
create policy "Users can create own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Transactions: users can CRUD their own transactions
create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);
