/*
  # Update RLS policies for universal access

  1. Policy Changes
    - Allow any authenticated user to create, read, update, and delete leads
    - Allow any authenticated user to create, read, update, and delete deals
    - Allow any authenticated user to create, read, update, and delete proposals
    - Allow any authenticated user to create, read, update, and delete closer reports
    - Allow any authenticated user to create, read, update, and delete setter reports
    - Maintain existing users table policies (users can only modify their own profile)

  2. Security
    - Keep RLS enabled on all tables
    - Maintain authentication requirement
    - Remove creator/owner restrictions for operational flexibility

  3. Rationale
    - Enable team collaboration across all records
    - Allow managers to update any team member's work
    - Simplify permissions for better workflow
*/

-- Update leads table policies
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can update their leads" ON leads;
DROP POLICY IF EXISTS "Users can delete leads they created" ON leads;

CREATE POLICY "Authenticated users can manage all leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update deals table policies
DROP POLICY IF EXISTS "Users can create deals" ON deals;
DROP POLICY IF EXISTS "Users can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can update deals they own or are assigned to" ON deals;
DROP POLICY IF EXISTS "Users can delete deals they created" ON deals;

CREATE POLICY "Authenticated users can manage all deals"
  ON deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update proposals table policies
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Users can view all proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update proposals they created or are assigned to" ON proposals;
DROP POLICY IF EXISTS "Users can delete proposals they created" ON proposals;

CREATE POLICY "Authenticated users can manage all proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update closer_reports table policies
DROP POLICY IF EXISTS "Users can create closer reports" ON closer_reports;
DROP POLICY IF EXISTS "Users can view all closer reports" ON closer_reports;
DROP POLICY IF EXISTS "Users can update their own closer reports" ON closer_reports;
DROP POLICY IF EXISTS "Users can delete their own closer reports" ON closer_reports;

CREATE POLICY "Authenticated users can manage all closer reports"
  ON closer_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update setter_reports table policies
DROP POLICY IF EXISTS "Users can create setter reports" ON setter_reports;
DROP POLICY IF EXISTS "Users can view all setter reports" ON setter_reports;
DROP POLICY IF EXISTS "Users can update their own setter reports" ON setter_reports;
DROP POLICY IF EXISTS "Users can delete their own setter reports" ON setter_reports;

CREATE POLICY "Authenticated users can manage all setter reports"
  ON setter_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep users table policies as they are (users should only manage their own profile)
-- No changes needed for users table policies