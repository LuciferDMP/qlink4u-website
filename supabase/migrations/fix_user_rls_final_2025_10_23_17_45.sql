-- Fix RLS policies for user registration
-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users_2025_10_23_12_04;

-- Create simple, working RLS policies
CREATE POLICY "Allow authenticated users to insert their own profile" 
ON public.users_2025_10_23_12_04 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to view their own profile" 
ON public.users_2025_10_23_12_04 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile" 
ON public.users_2025_10_23_12_04 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow service role full access for Edge Functions
CREATE POLICY "Allow service role full access" 
ON public.users_2025_10_23_12_04 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Clean up any test data
DELETE FROM public.users_2025_10_23_12_04 WHERE email = 'test@example.com';