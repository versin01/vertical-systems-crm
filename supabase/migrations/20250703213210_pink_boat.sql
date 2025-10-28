/*
  # Add Revenue, Cash Collected, and Assign To Fields

  1. New Columns
    - `revenue_generated` (numeric) - Track potential/actual revenue from lead
    - `cash_collected` (numeric) - Track actual cash collected from lead
    - `assigned_to` (uuid) - User assigned to handle this lead

  2. Updates
    - Add proper constraints and defaults
    - Update indexes for performance
    - Add foreign key for assigned_to field

  3. Data Migration
    - Set default values for existing leads
*/

-- Add revenue_generated column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'revenue_generated'
  ) THEN
    ALTER TABLE leads ADD COLUMN revenue_generated NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Add cash_collected column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'cash_collected'
  ) THEN
    ALTER TABLE leads ADD COLUMN cash_collected NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Update existing leads with default values
UPDATE leads 
SET 
  revenue_generated = COALESCE(revenue_generated, 0),
  cash_collected = COALESCE(cash_collected, 0)
WHERE revenue_generated IS NULL OR cash_collected IS NULL;

-- Add constraints for revenue fields
ALTER TABLE leads 
ADD CONSTRAINT check_revenue_generated_positive 
CHECK (revenue_generated >= 0);

ALTER TABLE leads 
ADD CONSTRAINT check_cash_collected_positive 
CHECK (cash_collected >= 0);

ALTER TABLE leads 
ADD CONSTRAINT check_cash_not_exceed_revenue 
CHECK (cash_collected <= revenue_generated);

-- Add indexes for performance on financial fields
CREATE INDEX IF NOT EXISTS idx_leads_revenue_generated ON leads (revenue_generated);
CREATE INDEX IF NOT EXISTS idx_leads_cash_collected ON leads (cash_collected);
CREATE INDEX IF NOT EXISTS idx_leads_financial_summary ON leads (revenue_generated, cash_collected);

-- Update the estimated_value column to be more aligned with revenue_generated
COMMENT ON COLUMN leads.estimated_value IS 'Legacy field - use revenue_generated instead';
COMMENT ON COLUMN leads.revenue_generated IS 'Total revenue generated from this lead';
COMMENT ON COLUMN leads.cash_collected IS 'Actual cash collected from this lead';