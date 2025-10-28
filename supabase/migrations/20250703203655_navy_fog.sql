/*
  # Add Follow-up Tracking to Leads Table

  1. New Fields
    - `follow_ups_completed` (JSONB) - Array of 7 boolean values for follow-up completion status
    - `follow_up_dates` (JSONB) - Array of timestamps when each follow-up was completed

  2. Updates
    - Add follow-up tracking fields to existing leads table
    - Set default values for new fields
*/

-- Add follow-up tracking fields to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'follow_ups_completed'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_ups_completed JSONB DEFAULT '[false,false,false,false,false,false,false]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'follow_up_dates'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_dates JSONB DEFAULT '[null,null,null,null,null,null,null]';
  END IF;
END $$;

-- Update existing leads to have default follow-up values
UPDATE leads 
SET 
  follow_ups_completed = '[false,false,false,false,false,false,false]',
  follow_up_dates = '[null,null,null,null,null,null,null]'
WHERE follow_ups_completed IS NULL OR follow_up_dates IS NULL;