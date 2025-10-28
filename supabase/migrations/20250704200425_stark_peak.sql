/*
  # Create Setter Reports Table

  1. New Tables
    - `setter_reports`
      - `id` (uuid, primary key)
      - `setter_name` (text)
      - `setter_role` (text)
      - `new_leads_received` (integer)
      - `calls_expected` (integer)
      - `calls_made` (integer)
      - `cancelled_appointments` (integer)
      - `calls_not_qualified` (integer)
      - `linkedin_connections` (integer)
      - `loom_explanations_sent` (integer)
      - `sales_appointments_booked` (integer)
      - `notes` (text)
      - `report_date` (date)
      - `submitted_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `setter_reports` table
    - Add policies for authenticated users to manage reports
    - Add indexes for performance

  3. Constraints
    - Positive number validation for numeric fields
    - Date validation
    - Required fields validation
*/

-- Create setter_reports table
CREATE TABLE IF NOT EXISTS setter_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setter_name VARCHAR(200) NOT NULL,
  setter_role VARCHAR(100) NOT NULL,
  new_leads_received INTEGER DEFAULT 0,
  calls_expected INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  calls_not_qualified INTEGER DEFAULT 0,
  linkedin_connections INTEGER DEFAULT 0,
  loom_explanations_sent INTEGER DEFAULT 0,
  sales_appointments_booked INTEGER DEFAULT 0,
  notes TEXT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints for positive numbers
ALTER TABLE setter_reports ADD CONSTRAINT check_new_leads_received_positive 
  CHECK (new_leads_received >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_calls_expected_positive 
  CHECK (calls_expected >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_calls_made_positive 
  CHECK (calls_made >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_cancelled_appointments_positive 
  CHECK (cancelled_appointments >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_calls_not_qualified_positive 
  CHECK (calls_not_qualified >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_linkedin_connections_positive 
  CHECK (linkedin_connections >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_loom_explanations_sent_positive 
  CHECK (loom_explanations_sent >= 0);

ALTER TABLE setter_reports ADD CONSTRAINT check_sales_appointments_booked_positive 
  CHECK (sales_appointments_booked >= 0);

-- Enable RLS
ALTER TABLE setter_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all setter reports" 
  ON setter_reports FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create setter reports" 
  ON setter_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own setter reports" 
  ON setter_reports FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can delete their own setter reports" 
  ON setter_reports FOR DELETE 
  TO authenticated 
  USING (auth.uid() = submitted_by);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_setter_reports_report_date ON setter_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_setter_reports_submitted_by ON setter_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_setter_reports_setter_name ON setter_reports(setter_name);
CREATE INDEX IF NOT EXISTS idx_setter_reports_created_at ON setter_reports(created_at);

-- Create composite index for daily reports by user
CREATE INDEX IF NOT EXISTS idx_setter_reports_daily_user ON setter_reports(report_date, submitted_by);

-- Add updated_at trigger
CREATE TRIGGER update_setter_reports_updated_at 
  BEFORE UPDATE ON setter_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for daily setter report summaries
CREATE OR REPLACE VIEW daily_setter_summary AS
SELECT 
  report_date,
  COUNT(*) as total_reports,
  SUM(new_leads_received) as total_new_leads,
  SUM(calls_made) as total_calls_made,
  SUM(sales_appointments_booked) as total_appointments_booked,
  AVG(CASE WHEN calls_expected > 0 THEN (calls_made::float / calls_expected) * 100 ELSE 0 END) as avg_call_completion_rate
FROM setter_reports 
GROUP BY report_date
ORDER BY report_date DESC;

-- Grant permissions
GRANT ALL ON setter_reports TO authenticated;
GRANT SELECT ON daily_setter_summary TO authenticated;