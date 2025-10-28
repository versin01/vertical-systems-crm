/*
  # Create Comprehensive Leads Table

  1. New Tables
    - `leads`
      - Primary fields: id, first_name, last_name, email, phone, company, job_title
      - Lead management: status, lead_source, lead_type, priority
      - Financial tracking: estimated_value, probability
      - Date tracking: first_contact_date, last_contact_date, next_follow_up_date, conversion_date, lost_date
      - Additional info: notes, tags, website, address details
      - System fields: assigned_to, created_by, created_at, updated_at

  2. Security
    - Enable RLS on `leads` table
    - Add policies for authenticated users to manage leads
    - Users can read all leads, but only modify leads they created or are assigned to

  3. Performance
    - Indexes on commonly queried fields
    - Email uniqueness constraint
    - Check constraints for data validation
    - Automated updated_at trigger

  4. Data Validation
    - Email format validation
    - Probability percentage constraints (0-100)
    - Required fields with NOT NULL constraints
*/

-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  -- Primary Fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(200),
  job_title VARCHAR(150),

  -- Lead Management Fields
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  lead_source VARCHAR(100),
  lead_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',

  -- Financial Fields
  estimated_value DECIMAL(10,2) DEFAULT 0,
  probability INTEGER DEFAULT 0,

  -- Tracking Fields
  first_contact_date TIMESTAMPTZ,
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  conversion_date TIMESTAMPTZ,
  lost_date TIMESTAMPTZ,
  lost_reason VARCHAR(200),

  -- Additional Information
  notes TEXT,
  tags VARCHAR(500),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(100),
  zip_code VARCHAR(20),

  -- System Fields
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraints
ALTER TABLE leads ADD CONSTRAINT check_probability_range 
  CHECK (probability >= 0 AND probability <= 100);

ALTER TABLE leads ADD CONSTRAINT check_status_values 
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'closed_won', 'closed_lost', 'nurturing', 'unqualified'));

ALTER TABLE leads ADD CONSTRAINT check_priority_values 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE leads ADD CONSTRAINT check_lead_type_values 
  CHECK (lead_type IS NULL OR lead_type IN ('inbound', 'outbound', 'referral', 'partner'));

-- Add email validation constraint
ALTER TABLE leads ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_date ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_status_assigned_to ON leads(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by_status ON leads(created_by, status);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_assigned ON leads(next_follow_up_date, assigned_to) WHERE next_follow_up_date IS NOT NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view all leads (for team collaboration)
CREATE POLICY "Users can view all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert leads (and become the creator)
CREATE POLICY "Users can create leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update leads they created or are assigned to
CREATE POLICY "Users can update their leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  );

-- Policy: Users can delete leads they created
CREATE POLICY "Users can delete leads they created"
  ON leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create a view for lead statistics (optional but useful)
CREATE OR REPLACE VIEW lead_stats AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(estimated_value) as avg_value,
  SUM(estimated_value) as total_value,
  AVG(probability) as avg_probability
FROM leads 
GROUP BY status;

-- Create a view for leads requiring follow-up
CREATE OR REPLACE VIEW leads_requiring_followup AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  company,
  status,
  next_follow_up_date,
  assigned_to,
  created_by
FROM leads 
WHERE next_follow_up_date IS NOT NULL 
  AND next_follow_up_date <= now() + INTERVAL '7 days'
  AND status NOT IN ('closed_won', 'closed_lost', 'unqualified')
ORDER BY next_follow_up_date ASC;

-- Grant necessary permissions
GRANT ALL ON leads TO authenticated;
GRANT SELECT ON lead_stats TO authenticated;
GRANT SELECT ON leads_requiring_followup TO authenticated;