/*
  # Copy authenticated users to users table

  1. Data Migration
    - Copy all confirmed authenticated users to the users table
    - Extract metadata from raw_user_meta_data field
    - Set appropriate defaults for missing values
    - Prevent duplicates with ON CONFLICT

  2. Safety Features
    - Only copy confirmed, non-deleted users
    - Use COALESCE for safe defaults
    - Idempotent operation (can run multiple times)
*/

-- Copy authenticated users to users table
INSERT INTO users (
  id,
  email,
  full_name,
  phone,
  job_title,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone,
  COALESCE(au.raw_user_meta_data->>'job_title', '') as job_title,
  COALESCE(au.raw_user_meta_data->>'role', 'User') as role,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.deleted_at IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Log the results
DO $$
DECLARE
  user_count INTEGER;
  auth_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE deleted_at IS NULL AND email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE 'Migration completed: % users in users table, % confirmed auth users', user_count, auth_count;
END $$;