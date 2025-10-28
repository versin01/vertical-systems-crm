/*
  # Add Receivables Fields to Cash Entries

  1. New Columns
    - `due_date` (date) - When payment is due
    - `setter_id` (uuid, foreign key) - Links to users table for setter assignment

  2. Indexes
    - Add indexes on new columns for performance

  3. Foreign Key Constraint
    - Link setter_id to users table
*/

-- Add due_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_entries' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE cash_entries ADD COLUMN due_date date;
  END IF;
END $$;

-- Add setter_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_entries' AND column_name = 'setter_id'
  ) THEN
    ALTER TABLE cash_entries ADD COLUMN setter_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for setter_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cash_entries_setter_id_fkey'
  ) THEN
    ALTER TABLE cash_entries 
    ADD CONSTRAINT cash_entries_setter_id_fkey 
    FOREIGN KEY (setter_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_entries_due_date ON cash_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_cash_entries_setter_id ON cash_entries(setter_id);
CREATE INDEX IF NOT EXISTS idx_cash_entries_due_date_status ON cash_entries(due_date, status);
CREATE INDEX IF NOT EXISTS idx_cash_entries_setter_status ON cash_entries(setter_id, status);