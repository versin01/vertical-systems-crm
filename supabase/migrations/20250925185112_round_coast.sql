/*
  # Create cash entries and offers system

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `cash_entries`
      - `id` (uuid, primary key)
      - `date` (date)
      - `income` (numeric, amount received)
      - `offer_id` (uuid, foreign key to offers)
      - `client_name` (text)
      - `client_email` (text)
      - `payment_type` (text, enum values)
      - `status` (text, enum values)
      - `contracted_amount` (numeric)
      - `gross_profit` (numeric)
      - `setter_percentage` (numeric, 0-100)
      - `setter_payment` (numeric, calculated)
      - `closer_percentage` (numeric, 0-100)
      - `closer_payment` (numeric, calculated)
      - `total_commissions` (numeric, calculated)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage all records
    - Add constraints for data validation

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints where appropriate
*/

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cash_entries table
CREATE TABLE IF NOT EXISTS cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  income numeric(12,2) NOT NULL DEFAULT 0,
  offer_id uuid REFERENCES offers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  payment_type text NOT NULL DEFAULT 'Deposit',
  status text NOT NULL DEFAULT 'Paid',
  contracted_amount numeric(12,2) NOT NULL DEFAULT 0,
  gross_profit numeric(12,2) NOT NULL DEFAULT 0,
  setter_percentage numeric(5,2) NOT NULL DEFAULT 0,
  setter_payment numeric(12,2) NOT NULL DEFAULT 0,
  closer_percentage numeric(5,2) NOT NULL DEFAULT 0,
  closer_payment numeric(12,2) NOT NULL DEFAULT 0,
  total_commissions numeric(12,2) NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints for cash_entries
ALTER TABLE cash_entries 
ADD CONSTRAINT check_income_positive 
CHECK (income >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_contracted_amount_positive 
CHECK (contracted_amount >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_gross_profit_positive 
CHECK (gross_profit >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_setter_percentage_range 
CHECK (setter_percentage >= 0 AND setter_percentage <= 100);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_closer_percentage_range 
CHECK (closer_percentage >= 0 AND closer_percentage <= 100);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_setter_payment_positive 
CHECK (setter_payment >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_closer_payment_positive 
CHECK (closer_payment >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_total_commissions_positive 
CHECK (total_commissions >= 0);

ALTER TABLE cash_entries 
ADD CONSTRAINT check_email_format 
CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE cash_entries 
ADD CONSTRAINT check_payment_type_values 
CHECK (payment_type IN ('Deposit', 'Installment', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'));

ALTER TABLE cash_entries 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('Paid', 'Canceled', 'Refunded'));

-- Enable Row Level Security
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offers
CREATE POLICY "Authenticated users can view all offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offers"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offers"
  ON offers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for cash_entries
CREATE POLICY "Authenticated users can view all cash entries"
  ON cash_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cash entries"
  ON cash_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cash entries"
  ON cash_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cash entries"
  ON cash_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_name ON offers(name);
CREATE INDEX IF NOT EXISTS idx_offers_created_by ON offers(created_by);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);

CREATE INDEX IF NOT EXISTS idx_cash_entries_date ON cash_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_entries_offer_id ON cash_entries(offer_id);
CREATE INDEX IF NOT EXISTS idx_cash_entries_client_email ON cash_entries(client_email);
CREATE INDEX IF NOT EXISTS idx_cash_entries_payment_type ON cash_entries(payment_type);
CREATE INDEX IF NOT EXISTS idx_cash_entries_status ON cash_entries(status);
CREATE INDEX IF NOT EXISTS idx_cash_entries_created_by ON cash_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_entries_created_at ON cash_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_entries_income ON cash_entries(income);
CREATE INDEX IF NOT EXISTS idx_cash_entries_gross_profit ON cash_entries(gross_profit);

-- Create updated_at triggers
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_entries_updated_at
  BEFORE UPDATE ON cash_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for cash entry summaries
CREATE OR REPLACE VIEW cash_entry_stats AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(income) as total_income,
  SUM(gross_profit) as total_gross_profit,
  SUM(total_commissions) as total_commissions,
  AVG(income) as avg_income,
  AVG(gross_profit) as avg_gross_profit
FROM cash_entries
GROUP BY status;

-- Create a view for monthly cash summaries
CREATE OR REPLACE VIEW monthly_cash_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as total_entries,
  SUM(income) as total_income,
  SUM(gross_profit) as total_gross_profit,
  SUM(total_commissions) as total_commissions,
  SUM(setter_payment) as total_setter_payments,
  SUM(closer_payment) as total_closer_payments,
  AVG(income) as avg_income
FROM cash_entries
WHERE status = 'Paid'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;