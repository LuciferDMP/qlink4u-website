-- Fix RLS policies for users table
-- Allow users to create their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_2025_10_23_12_04;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can insert own profile" ON public.users_2025_10_23_12_04
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.users_2025_10_23_12_04
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users_2025_10_23_12_04
    FOR UPDATE USING (auth.uid() = id);

-- Fix RLS policies for links table
DROP POLICY IF EXISTS "Users can view own links" ON public.links_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can create links" ON public.links_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can update own links" ON public.links_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can delete own links" ON public.links_2025_10_23_12_04;
DROP POLICY IF EXISTS "Anyone can view active links" ON public.links_2025_10_23_12_04;

-- Create comprehensive RLS policies for links table
CREATE POLICY "Anyone can view active links" ON public.links_2025_10_23_12_04
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create links" ON public.links_2025_10_23_12_04
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Users can view own links" ON public.links_2025_10_23_12_04
    FOR SELECT USING (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Users can update own links" ON public.links_2025_10_23_12_04
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON public.links_2025_10_23_12_04
    FOR DELETE USING (auth.uid() = user_id);

-- Fix RLS policies for clicks table
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can view clicks for own links" ON public.clicks_2025_10_23_12_04;

CREATE POLICY "Anyone can insert clicks" ON public.clicks_2025_10_23_12_04
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view clicks for own links" ON public.clicks_2025_10_23_12_04
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.links_2025_10_23_12_04 
            WHERE id = clicks_2025_10_23_12_04.link_id 
            AND (user_id = auth.uid() OR user_id IS NULL)
        )
    );