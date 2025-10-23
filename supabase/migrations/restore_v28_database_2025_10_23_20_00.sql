-- Drop Google Sheets tables
DROP TABLE IF EXISTS public.qlink_users CASCADE;
DROP TABLE IF EXISTS public.qlink_links CASCADE;

-- Recreate original V28 tables
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

CREATE TABLE public.links_2025_10_23_12_04 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    link_type TEXT DEFAULT 'redirect' CHECK (link_type IN ('redirect', 'masking')),
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    max_clicks INTEGER,
    click_count INTEGER DEFAULT 0,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "users_select_own" ON public.users_2025_10_23_12_04
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users_2025_10_23_12_04
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_via_trigger" ON public.users_2025_10_23_12_04
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for links
CREATE POLICY "links_select_own" ON public.links_2025_10_23_12_04
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "links_insert_own" ON public.links_2025_10_23_12_04
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "links_update_own" ON public.links_2025_10_23_12_04
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "links_delete_own" ON public.links_2025_10_23_12_04
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_links_alias ON public.links_2025_10_23_12_04(alias);
CREATE INDEX idx_links_user_id ON public.links_2025_10_23_12_04(user_id);
CREATE INDEX idx_users_email ON public.users_2025_10_23_12_04(email);