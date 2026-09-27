/*
# Create products table for BizzSuite inventory

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `name` (text, not null)
  - `sku` (text, optional, unique per user)
  - `category` (text, optional)
  - `cost_price` (numeric, defaults to 0)
  - `selling_price` (numeric, defaults to 0)
  - `stock_quantity` (integer, defaults to 0)
  - `low_stock_threshold` (integer, defaults to 10)
  - `image_url` (text, optional)
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `products`.
- Owner-scoped CRUD: each authenticated user can only access their own products.
- SELECT, INSERT, UPDATE, DELETE policies scoped to auth.uid() = user_id.

3. Indexes
- Index on user_id for fast per-user queries.
- Unique constraint on (user_id, sku) to prevent duplicate SKUs per business.

4. Important Notes
- The `user_id` column defaults to `auth.uid()` so frontend inserts that omit
  user_id will automatically use the authenticated user's ID.
- SKU is unique per user (not globally), allowing different businesses to
  reuse the same SKU codes.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text DEFAULT 'Uncategorized',
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_user_sku ON products(user_id, sku) WHERE sku IS NOT NULL;

DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (auth.uid() = user_id);