/*
# Create customers and sales tables for BizzSuite

1. New Tables
- `customers`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `name` (text, not null)
  - `phone` (text, not null, unique per user)
  - `email` (text, optional)
  - `address` (text, optional)
  - `notes` (text, optional)
  - `balance` (numeric, defaults to 0 — outstanding udhaar amount)
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now)

- `sales`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `invoice_number` (text, not null, unique per user — e.g. INV-0001)
  - `customer_id` (uuid, nullable, references customers — null for walk-in)
  - `customer_name` (text, not null — denormalized for display)
  - `items` (jsonb, not null — array of {product_id, name, sku, qty, unit_price, subtotal})
  - `subtotal` (numeric, not null)
  - `discount` (numeric, not null, default 0)
  - `tax` (numeric, not null, default 0)
  - `total` (numeric, not null)
  - `payment_method` (text, not null — cash, card, online, credit)
  - `status` (text, not null — paid, unpaid)
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own customers and sales.
- SELECT, INSERT, UPDATE, DELETE policies scoped to auth.uid() = user_id.

3. Indexes
- Index on user_id for both tables for fast per-user queries.
- Unique constraint on (user_id, phone) for customers.
- Unique constraint on (user_id, invoice_number) for sales.

4. Important Notes
- The `user_id` column defaults to `auth.uid()` on both tables.
- Customer `balance` tracks outstanding credit (udhaar). When a sale is made
  with payment_method='credit', the sale total is added to the customer's balance.
- Sales `items` is stored as JSONB containing line items with product details
  denormalized so invoices remain accurate even if products are later edited or deleted.
- `customer_name` is denormalized so sales list display works even for walk-in customers.
- Invoice numbers are generated per-user sequentially (INV-0001, INV-0002, etc.).
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  notes text,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_phone ON customers(user_id, phone);

DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_user_invoice ON sales(user_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);

DROP POLICY IF EXISTS "select_own_sales" ON sales;
CREATE POLICY "select_own_sales" ON sales FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sales" ON sales;
CREATE POLICY "insert_own_sales" ON sales FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sales" ON sales;
CREATE POLICY "update_own_sales" ON sales FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sales" ON sales;
CREATE POLICY "delete_own_sales" ON sales FOR DELETE
  TO authenticated USING (auth.uid() = user_id);