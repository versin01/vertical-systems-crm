/*
  # Create users table for profile management

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `phone` (text)
      - `job_title` (text)
      - `role` (text, default 'User')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to view all users
    - Add policies for users to update their own profile
    - Add policies for users to insert their own profile

  3. Constraints
    - Role validation (User, Finance, Admin)
    - Email uniqueness
    - Foreign key to auth.users with cascade delete
*/

-- Create users table WITHOUT auto-triggers
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  job_title VARCHAR(150),
  role VARCHAR(50) NOT NULL DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role validation constraint (using DO block to handle IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_role_values' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_role_values 
      CHECK (role IN ('User', 'Finance', 'Admin'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Simple policies - no complex joins that could cause issues
CREATE POLICY "Users can view all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON users FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add updated_at trigger function (create or replace to handle existing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();