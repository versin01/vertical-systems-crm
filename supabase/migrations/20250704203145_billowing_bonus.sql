/*
  # Create Proposals Table

  1. New Tables
    - `proposals`
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals table)
      - `title` (text)
      - `proposal_text` (text)
      - `deliverables` (jsonb)
      - `timelines` (jsonb)
      - `proposal_value` (numeric)
      - `follow_up_count` (integer)
      - `status` (text)
      - `created_by` (uuid, foreign key to users)
      - `assigned_to` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `sent_date` (timestamptz)
      - `last_viewed_date` (timestamptz)
      - `expiration_date` (timestamptz)
      - `client_notes` (text)
      - `internal_notes` (text)

  2. Security
    - Enable RLS on `proposals` table
    - Add policies for authenticated users to manage proposals
    - Users can read all proposals, but only modify proposals they created or are assigned to

  3. Performance
    - Indexes on commonly queried fields
    - Automated updated_at trigger

  4. Data Validation
    - Status validation
    - Required fields with NOT NULL constraints
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  proposal_text TEXT,
  deliverables JSONB DEFAULT '[]',
  timelines JSONB DEFAULT '[]',
  proposal_value NUMERIC(12,2) DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_date TIMESTAMPTZ,
  last_viewed_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  client_notes TEXT,
  internal_notes TEXT
);

-- Add constraints
ALTER TABLE proposals ADD CONSTRAINT check_proposal_value_positive 
  CHECK (proposal_value >= 0);

ALTER TABLE proposals ADD CONSTRAINT check_follow_up_count_positive 
  CHECK (follow_up_count >= 0);

ALTER TABLE proposals ADD CONSTRAINT check_status_values 
  CHECK (status IN (
    'draft',
    'review',
    'approved',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired',
    'revised'
  ));

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all proposals" 
  ON proposals FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create proposals" 
  ON proposals FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update proposals they created or are assigned to" 
  ON proposals FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete proposals they created" 
  ON proposals FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_deal_id ON proposals(deal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_assigned_to ON proposals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_sent_date ON proposals(sent_date);
CREATE INDEX IF NOT EXISTS idx_proposals_expiration_date ON proposals(expiration_date);

-- Add updated_at trigger
CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON proposals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for proposal statistics
CREATE OR REPLACE VIEW proposal_stats AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(proposal_value) as avg_value,
  SUM(proposal_value) as total_value,
  AVG(follow_up_count) as avg_follow_ups
FROM proposals 
GROUP BY status;

-- Grant permissions
GRANT ALL ON proposals TO authenticated;
GRANT SELECT ON proposal_stats TO authenticated;