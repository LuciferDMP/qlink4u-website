-- Create completely new clean tables with new names
-- Drop all old tables
DROP TABLE IF EXISTS public.users_2025_10_23_12_04 CASCADE;
DROP TABLE IF EXISTS public.links_2025_10_23_12_04 CASCADE;
DROP TABLE IF EXISTS public.clicks_2025_10_23_12_04 CASCADE;
DROP TABLE IF EXISTS public.subscriptions_2025_10_23_12_04 CASCADE;

-- Create new clean users table
CREATE TABLE public.qlink_users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create new clean links table
CREATE TABLE public.qlink_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS, no triggers, no constraints
ALTER TABLE public.qlink_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qlink_links DISABLE ROW LEVEL SECURITY;

-- Test inserts
INSERT INTO public.qlink_users (id, email, full_name) 
VALUES (gen_random_uuid(), 'test-clean@example.com', 'Clean Test')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.qlink_links (alias, destination_url) 
VALUES ('test-clean', 'https://example.com')
ON CONFLICT (alias) DO NOTHING;

-- Verify tables work
SELECT COUNT(*) as users_count FROM public.qlink_users;
SELECT COUNT(*) as links_count FROM public.qlink_links;

-- Clean up test data
DELETE FROM public.qlink_users WHERE email = 'test-clean@example.com';
DELETE FROM public.qlink_links WHERE alias = 'test-clean';