/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `date` (date, required)
      - `amount` (numeric, required, positive)
      - `expense_name` (text, required)
      - `expense_type` (text, required, constrained to specific values)
      - `invoice_filed` (boolean, default false)
      - `notes` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `expenses` table
    - Add policy for authenticated users to manage all expenses

  3. Constraints
    - Amount must be positive
    - Expense type must be one of the predefined values
    - Created by must reference a valid user

  4. Indexes
    - Index on date for date-based queries
    - Index on expense_type for filtering
    - Index on created_by for user-based queries
    - Index on invoice_filed for filtering
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL,
  expense_name text NOT NULL,
  expense_type text NOT NULL,
  invoice_filed boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view all expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- Add constraints
ALTER TABLE expenses ADD CONSTRAINT check_amount_positive 
  CHECK (amount >= 0);

ALTER TABLE expenses ADD CONSTRAINT check_expense_type_values 
  CHECK (expense_type IN (
    'Bank fees',
    'Course', 
    'Done with you program',
    'Done for you program',
    'Meta ads',
    'Agency fees',
    'Loan',
    'Misk',
    'Monthly software',
    'Other',
    'Personal',
    'Referral free',
    'Refund',
    'Taxes',
    'Team payroll',
    'Yearly software',
    'YouTube ads'
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_invoice_filed ON expenses(invoice_filed);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

-- Create updated_at trigger
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for expense statistics
CREATE OR REPLACE VIEW expense_stats AS
SELECT 
  expense_type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(CASE WHEN invoice_filed = true THEN 1 END) as filed_count,
  COUNT(CASE WHEN invoice_filed = false THEN 1 END) as unfiled_count
FROM expenses
GROUP BY expense_type
ORDER BY total_amount DESC;

-- Create view for monthly expense summary
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as total_entries,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(CASE WHEN invoice_filed = true THEN 1 END) as filed_entries,
  COUNT(CASE WHEN invoice_filed = false THEN 1 END) as unfiled_entries,
  SUM(CASE WHEN expense_type = 'Team payroll' THEN amount ELSE 0 END) as payroll_expenses,
  SUM(CASE WHEN expense_type IN ('Meta ads', 'YouTube ads') THEN amount ELSE 0 END) as advertising_expenses,
  SUM(CASE WHEN expense_type IN ('Monthly software', 'Yearly software') THEN amount ELSE 0 END) as software_expenses
FROM expenses
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;