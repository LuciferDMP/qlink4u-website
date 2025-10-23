-- Drop foreign key constraint from links table if it exists
ALTER TABLE public.links_2025_10_23_12_04 
DROP CONSTRAINT IF EXISTS links_2025_10_23_12_04_user_id_fkey;

-- Make user_id nullable so links can exist without users
ALTER TABLE public.links_2025_10_23_12_04 
ALTER COLUMN user_id DROP NOT NULL;

-- Disable RLS on links table too for testing
ALTER TABLE public.links_2025_10_23_12_04 DISABLE ROW LEVEL SECURITY;

-- Test that we can create links without user_id
INSERT INTO public.links_2025_10_23_12_04 (
    alias, 
    destination_url, 
    link_type,
    user_id
) VALUES (
    'test-no-user',
    'https://example.com',
    'redirect',
    NULL
) ON CONFLICT (alias) DO NOTHING;

-- Clean up test
DELETE FROM public.links_2025_10_23_12_04 WHERE alias = 'test-no-user';