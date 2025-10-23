-- Add missing subscription_status field to users table
ALTER TABLE public.users_2025_10_23_12_04 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled'));

-- Update existing users to have active subscription status
UPDATE public.users_2025_10_23_12_04 
SET subscription_status = 'active' 
WHERE subscription_status IS NULL;