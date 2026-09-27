/*
# Create suppliers, purchases, and expenses tables for BizzSuite

1. New Tables
- `suppliers`
  - id, user_id (defaults to auth.uid()), name, phone, email, address, company, notes,
    payable_balance (numeric, default 0), created_at, updated_at

- `purchases`
  - id, user_id, bill_number, supplier_id (nullable), supplier_name,
    items (jsonb: product_id, name, qty, unit_cost, subtotal),
    total, payment_method (cash/card/online/credit), status (paid/unpaid),
    purchase_date (date), created_at

- `expenses`
  - id, user_id, category, amount, expense_date (date), note,
    payment_method (cash/card/online), created_at

2. Security
- RLS enabled on all three tables.
- Owner-scoped CRUD: auth.uid() = user_id on all policies.

3. Indexes
- user_id on all tables.
- supplier_id on purchases.
- Unique (user_id, bill_number) on purchases.

4. Notes
- suppliers.payable_balance tracks credit owed to suppliers.
- purchases.items stored as JSONB with denormalized product details.
- When a purchase is "credit", total is added to supplier's payable_balance.
- Stock is incremented in application logic when a purchase completes.
*/

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  company text,
  notes text,
  payable_balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);

DROP POLICY IF EXISTS "select_own_suppliers" ON suppliers;
CREATE POLICY "select_own_suppliers" ON suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_suppliers" ON suppliers;
CREATE POLICY "insert_own_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_suppliers" ON suppliers;
CREATE POLICY "update_own_suppliers" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_suppliers" ON suppliers;
CREATE POLICY "delete_own_suppliers" ON suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_number text NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  items jsonb NOT NULL,
  total numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_bill ON purchases(user_id, bill_number);

DROP POLICY IF EXISTS "select_own_purchases" ON purchases;
CREATE POLICY "select_own_purchases" ON purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_purchases" ON purchases;
CREATE POLICY "insert_own_purchases" ON purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_purchases" ON purchases;
CREATE POLICY "update_own_purchases" ON purchases FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_purchases" ON purchases;
CREATE POLICY "delete_own_purchases" ON purchases FOR DELETE TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  payment_method text NOT NULL DEFAULT 'cash',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);