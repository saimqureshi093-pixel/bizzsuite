/*
# Create payments table for BizzSuite customer credit tracking

1. New Tables
- `payments`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `customer_id` (uuid, not null, references customers)
  - `amount` (numeric, not null — amount paid toward balance)
  - `payment_date` (date, not null, defaults to today)
  - `note` (text, optional)
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `payments`.
- Owner-scoped CRUD: each authenticated user can only access their own payments.
- SELECT, INSERT, DELETE policies scoped to auth.uid() = user_id.

3. Indexes
- Index on user_id for fast per-user queries.
- Index on customer_id for per-customer payment history.

4. Important Notes
- When a payment is recorded, the customer's `balance` in the `customers` table
  is reduced by the payment amount (done in application logic).
- Payments track individual credit repayments from customers who had credit (udhaar) sales.
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);