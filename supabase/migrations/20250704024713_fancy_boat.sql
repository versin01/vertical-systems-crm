/*
  # Create deals table for sales pipeline

  1. New Tables
    - `deals`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads table)
      - `deal_name` (text)
      - `deal_value` (numeric)
      - `probability` (integer, 0-100)
      - `expected_close_date` (timestamptz)
      - `actual_close_date` (timestamptz)
      - `stage` (text with enum constraint)
      - `deal_owner` (uuid, foreign key to users)
      - `service_type` (text)
      - `deal_source` (text)
      - `notes` (text)
      - `won_date` (timestamptz)
      - `lost_date` (timestamptz)
      - `lost_reason` (text)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `deals` table
    - Add policies for authenticated users to manage deals
    - Add indexes for performance

  3. Constraints
    - Stage validation
    - Service type validation
    - Probability range validation
    - Deal value positive validation
*/

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_name VARCHAR(200) NOT NULL,
  deal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  expected_close_date TIMESTAMPTZ,
  actual_close_date TIMESTAMPTZ,
  stage VARCHAR(50) NOT NULL DEFAULT 'new_opportunity',
  deal_owner UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type VARCHAR(100),
  deal_source VARCHAR(100),
  notes TEXT,
  won_date TIMESTAMPTZ,
  lost_date TIMESTAMPTZ,
  lost_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints
ALTER TABLE deals ADD CONSTRAINT check_deal_value_positive 
  CHECK (deal_value >= 0);

ALTER TABLE deals ADD CONSTRAINT check_probability_range 
  CHECK (probability >= 0 AND probability <= 100);

ALTER TABLE deals ADD CONSTRAINT check_stage_values 
  CHECK (stage IN (
    'new_opportunity',
    'discovery_call_scheduled',
    'discovery_call_completed',
    'proposal_preparation',
    'proposal_sent',
    'proposal_review',
    'negotiation',
    'contract_sent',
    'contract_signed',
    'project_kickoff',
    'lost',
    'on_hold'
  ));

ALTER TABLE deals ADD CONSTRAINT check_service_type_values 
  CHECK (service_type IS NULL OR service_type IN (
    'Growth Creator',
    'AIGC Systems',
    'Custom Projects',
    'Ongoing Support',
    'Business Consulting',
    'System Optimization',
    'CRM Implementation'
  ));

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all deals" 
  ON deals FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create deals" 
  ON deals FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update deals they own or are assigned to" 
  ON deals FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by OR auth.uid() = deal_owner)
  WITH CHECK (auth.uid() = created_by OR auth.uid() = deal_owner);

CREATE POLICY "Users can delete deals they created" 
  ON deals FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_deal_owner ON deals(deal_owner);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_service_type ON deals(service_type);
CREATE INDEX IF NOT EXISTS idx_deals_deal_source ON deals(deal_source);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_deal_value ON deals(deal_value);
CREATE INDEX IF NOT EXISTS idx_deals_probability ON deals(probability);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_deals_updated_at 
  BEFORE UPDATE ON deals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();