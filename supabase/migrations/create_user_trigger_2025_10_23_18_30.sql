-- Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simple function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into our users table with default values
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'personal',
    10,
    '/images/QLink4U.png',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS but with simpler policies
ALTER TABLE public.users_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.users_2025_10_23_12_04;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users_2025_10_23_12_04;

-- Create very simple RLS policies
CREATE POLICY "users_select_own" ON public.users_2025_10_23_12_04
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users_2025_10_23_12_04
  FOR UPDATE USING (auth.uid() = id);

-- Allow the trigger function to insert (no RLS check needed for triggers)
CREATE POLICY "users_insert_via_trigger" ON public.users_2025_10_23_12_04
  FOR INSERT WITH CHECK (true);