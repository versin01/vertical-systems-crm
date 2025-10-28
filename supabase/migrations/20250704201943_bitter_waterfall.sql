/*
  # Create closer_reports table

  1. New Tables
    - `closer_reports`
      - Personal info: closer_name, closer_role
      - Call statistics: total_calls_scheduled, calls_completed, follow_up_calls_scheduled
      - Sales metrics: revenue_generated, cash_collected, deposits
      - Meeting attendance: sales_team_meetings, leadership_meetings, training_sessions
      - Notes: follow_up_actions_required, challenges_faced, key_achievements, next_day_priorities
      - System fields: report_date, submitted_by, created_at, updated_at

  2. Security
    - Enable RLS on `closer_reports` table
    - Add policies for authenticated users to manage reports
    - Users can read all reports, but only modify reports they submitted

  3. Performance
    - Indexes on commonly queried fields
    - Automated updated_at trigger

  4. Data Validation
    - Positive number constraints
    - Required fields with NOT NULL constraints
*/

-- Create the closer_reports table
CREATE TABLE IF NOT EXISTS closer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_name VARCHAR(200) NOT NULL,
  closer_role VARCHAR(100) NOT NULL,
  
  -- Call Statistics
  total_calls_scheduled INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  follow_up_calls_scheduled INTEGER DEFAULT 0,
  
  -- Sales Metrics
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  cash_collected NUMERIC(12,2) DEFAULT 0,
  deposits NUMERIC(12,2) DEFAULT 0,
  
  -- Meeting Attendance
  sales_team_meetings INTEGER DEFAULT 0,
  leadership_meetings INTEGER DEFAULT 0,
  training_sessions INTEGER DEFAULT 0,
  
  -- Notes
  follow_up_actions_required TEXT,
  challenges_faced TEXT,
  key_achievements TEXT,
  next_day_priorities TEXT,
  
  -- System Fields
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints for positive numbers
ALTER TABLE closer_reports ADD CONSTRAINT check_total_calls_scheduled_positive 
  CHECK (total_calls_scheduled >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_calls_completed_positive 
  CHECK (calls_completed >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_follow_up_calls_scheduled_positive 
  CHECK (follow_up_calls_scheduled >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_revenue_generated_positive 
  CHECK (revenue_generated >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_cash_collected_positive 
  CHECK (cash_collected >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_deposits_positive 
  CHECK (deposits >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_sales_team_meetings_positive 
  CHECK (sales_team_meetings >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_leadership_meetings_positive 
  CHECK (leadership_meetings >= 0);

ALTER TABLE closer_reports ADD CONSTRAINT check_training_sessions_positive 
  CHECK (training_sessions >= 0);

-- Add constraint to ensure cash collected doesn't exceed revenue generated
ALTER TABLE closer_reports ADD CONSTRAINT check_cash_not_exceed_revenue 
  CHECK (cash_collected <= revenue_generated);

-- Enable RLS
ALTER TABLE closer_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all closer reports" 
  ON closer_reports FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create closer reports" 
  ON closer_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own closer reports" 
  ON closer_reports FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can delete their own closer reports" 
  ON closer_reports FOR DELETE 
  TO authenticated 
  USING (auth.uid() = submitted_by);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_closer_reports_report_date ON closer_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_closer_reports_submitted_by ON closer_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_closer_reports_closer_name ON closer_reports(closer_name);
CREATE INDEX IF NOT EXISTS idx_closer_reports_created_at ON closer_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_closer_reports_revenue_generated ON closer_reports(revenue_generated);
CREATE INDEX IF NOT EXISTS idx_closer_reports_cash_collected ON closer_reports(cash_collected);

-- Create composite index for daily reports by user
CREATE INDEX IF NOT EXISTS idx_closer_reports_daily_user ON closer_reports(report_date, submitted_by);

-- Add updated_at trigger
CREATE TRIGGER update_closer_reports_updated_at 
  BEFORE UPDATE ON closer_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for daily closer report summaries
CREATE OR REPLACE VIEW daily_closer_summary AS
SELECT 
  report_date,
  COUNT(*) as total_reports,
  SUM(calls_completed) as total_calls_completed,
  SUM(revenue_generated) as total_revenue_generated,
  SUM(cash_collected) as total_cash_collected,
  AVG(CASE WHEN total_calls_scheduled > 0 THEN (calls_completed::float / total_calls_scheduled) * 100 ELSE 0 END) as avg_call_completion_rate,
  AVG(CASE WHEN revenue_generated > 0 THEN (cash_collected::float / revenue_generated) * 100 ELSE 0 END) as avg_collection_rate
FROM closer_reports 
GROUP BY report_date
ORDER BY report_date DESC;

-- Grant permissions
GRANT ALL ON closer_reports TO authenticated;
GRANT SELECT ON daily_closer_summary TO authenticated;