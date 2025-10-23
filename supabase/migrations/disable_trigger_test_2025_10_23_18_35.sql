-- Disable the trigger temporarily to test if it's causing the issue
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Completely disable RLS on users table for testing
ALTER TABLE public.users_2025_10_23_12_04 DISABLE ROW LEVEL SECURITY;

-- Test if we can insert directly
INSERT INTO public.users_2025_10_23_12_04 (
    id,
    email,
    full_name,
    user_type,
    links_limit,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test-manual@example.com',
    'Manual Test User',
    'personal',
    10,
    '/images/QLink4U.png',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Clean up test data
DELETE FROM public.users_2025_10_23_12_04 WHERE email = 'test-manual@example.com';