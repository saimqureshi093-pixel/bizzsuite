/*
# Create settings table for business profile and preferences

1. New Tables
- `settings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `business_name` (text, nullable) — business display name
  - `logo_url` (text, nullable) — business logo image URL
  - `address` (text, nullable) — business address
  - `phone` (text, nullable) — business phone
  - `email` (text, nullable) — business email
  - `currency` (text, not null, default 'USD') — currency code (PKR, USD, EUR, GBP, INR, AED, SAR)
  - `tax_rate` (numeric, default 0) — default tax rate percentage for POS
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Security
  - Enable RLS on `settings`.
  - Owner-scoped CRUD: each authenticated user can only access their own settings row.
3. Notes
  - Each user has at most one settings row (enforced by unique constraint on user_id).
  - The frontend will use the currency code to determine the symbol for all price displays.
  - The tax_rate auto-fills in the POS screen.
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  logo_url text,
  address text,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'USD',
  tax_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
