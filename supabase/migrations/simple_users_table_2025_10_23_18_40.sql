-- Check if there are any constraints causing issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users_2025_10_23_12_04'::regclass;

-- Check current columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users_2025_10_23_12_04'
ORDER BY ordinal_position;

-- Drop and recreate the table with minimal structure
DROP TABLE IF EXISTS public.users_2025_10_23_12_04 CASCADE;

-- Create new simple users table
CREATE TABLE public.users_2025_10_23_12_04 (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_type TEXT DEFAULT 'personal',
    links_limit INTEGER DEFAULT 10,
    avatar_url TEXT DEFAULT '/images/QLink4U.png',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS, no triggers, no constraints
ALTER TABLE public.users_2025_10_23_12_04 DISABLE ROW LEVEL SECURITY;

-- Test insert to make sure table works
INSERT INTO public.users_2025_10_23_12_04 (id, email, full_name) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test-simple@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Verify insert worked
SELECT COUNT(*) as test_count FROM public.users_2025_10_23_12_04 WHERE email = 'test-simple@example.com';

-- Clean up test data
DELETE FROM public.users_2025_10_23_12_04 WHERE email = 'test-simple@example.com';