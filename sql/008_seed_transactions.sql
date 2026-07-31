-- ============================================================
-- Seed test transactions for admin user
-- Run after 003_seed.sql or whenever you need test data
-- Idempotent: safe to re-run (skips if data already exists)
-- ============================================================

DO $$
DECLARE
  v_user_id UUID := 'e4c0ebb4-3477-4482-9e9a-b39bc7e56be9';
  v_cop_wallet UUID := 'f305cdf4-9f6f-467d-ad10-e826851782fb';
  v_mxn_wallet UUID := '4269ccd1-f0f8-4055-86da-4b1e88f53232';
  v_cat_food UUID;
  v_cat_transport UUID;
  v_cat_entertainment UUID;
  v_cat_shopping UUID;
  v_cat_utilities UUID;
  v_cat_salary UUID;
  v_today DATE := CURRENT_DATE;
  v_count INT;
BEGIN
  -- Check if admin already has transactions
  SELECT count(*) INTO v_count FROM transactions WHERE user_id = v_user_id;
  IF v_count > 0 THEN
    RAISE NOTICE 'Admin already has % transactions. Skipping seed.', v_count;
    RETURN;
  END IF;

  -- Get category IDs
  SELECT id INTO v_cat_food FROM categories WHERE name = 'Food' AND type = 'expense' AND user_id IS NULL LIMIT 1;
  SELECT id INTO v_cat_transport FROM categories WHERE name = 'Transport' AND type = 'expense' AND user_id IS NULL LIMIT 1;
  SELECT id INTO v_cat_entertainment FROM categories WHERE name = 'Entertainment' AND type = 'expense' AND user_id IS NULL LIMIT 1;
  SELECT id INTO v_cat_shopping FROM categories WHERE name = 'Shopping' AND type = 'expense' AND user_id IS NULL LIMIT 1;
  SELECT id INTO v_cat_utilities FROM categories WHERE name = 'Utilities' AND type = 'expense' AND user_id IS NULL LIMIT 1;
  SELECT id INTO v_cat_salary FROM categories WHERE name = 'Salary' AND type = 'income' AND user_id IS NULL LIMIT 1;

  -- === COP Wallet ===
  INSERT INTO transactions (user_id, wallet_id, category_id, amount, description, date, type) VALUES
    (v_user_id, v_cop_wallet, v_cat_food,         45000,  'Almuerzo restaurante',     v_today - 5, 'expense'),
    (v_user_id, v_cop_wallet, v_cat_transport,    12000,  'Uber aeropuerto',          v_today - 4, 'expense'),
    (v_user_id, v_cop_wallet, v_cat_entertainment, 35000, 'Netflix + Spotify',        v_today - 3, 'expense'),
    (v_user_id, v_cop_wallet, v_cat_shopping,     80000,  'Zapatos nuevos',           v_today - 2, 'expense'),
    (v_user_id, v_cop_wallet, v_cat_utilities,    95000,  'Internet + Electricidad',  v_today - 1, 'expense'),
    (v_user_id, v_cop_wallet, v_cat_salary,      2000000, 'Salario mensual',          v_today - 7, 'income');

  -- === MXN Wallet ===
  INSERT INTO transactions (user_id, wallet_id, category_id, amount, description, date, type) VALUES
    (v_user_id, v_mxn_wallet, v_cat_food,         250,  'Comida callejera',          v_today - 5, 'expense'),
    (v_user_id, v_mxn_wallet, v_cat_transport,     85,  'Metro一周卡',              v_today - 4, 'expense'),
    (v_user_id, v_mxn_wallet, v_cat_entertainment, 180,  'Cine + Palomitas',         v_today - 3, 'expense'),
    (v_user_id, v_mxn_wallet, v_cat_shopping,     500,  'Ropa en Liverpool',         v_today - 2, 'expense'),
    (v_user_id, v_mxn_wallet, v_cat_utilities,    350,  'Teléfono celular',          v_today - 1, 'expense'),
    (v_user_id, v_mxn_wallet, v_cat_salary,     15000,  'Freelance project',         v_today - 7, 'income');

  RAISE NOTICE 'Seeded 12 transactions for admin user (6 COP + 6 MXN).';
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
