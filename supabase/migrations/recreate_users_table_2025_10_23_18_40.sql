-- Check current table structure
\d public.users_2025_10_23_12_04;

-- Check if there are any constraints causing issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users_2025_10_23_12_04'::regclass;

-- Check if table exists and what columns it has
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_type TEXT DEFAULT 'personal',
    links_limit INTEGER DEFAULT 10,
    avatar_url TEXT DEFAULT '/images/QLink4U.png',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS for now
ALTER TABLE public.users_2025_10_23_12_04 DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO public.users_2025_10_23_12_04 (id, email, full_name) 
VALUES (gen_random_uuid(), 'test-new-table@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Clean up
DELETE FROM public.users_2025_10_23_12_04 WHERE email = 'test-new-table@example.com';