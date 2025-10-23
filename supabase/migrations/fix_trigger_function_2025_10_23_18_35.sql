-- Check if trigger exists and is working
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Drop and recreate with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    -- Extract name from metadata or email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name', 
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Try to insert with minimal required fields only
    INSERT INTO public.users_2025_10_23_12_04 (
        id,
        email,
        full_name,
        user_type,
        links_limit,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_name,
        'personal',
        10,
        NOW(),
        NOW()
    );
    
    -- Log success
    RAISE LOG 'Successfully created user profile for %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, that's ok
        RAISE LOG 'User profile already exists for %', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log detailed error but don't fail auth
        RAISE LOG 'Failed to create user profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';