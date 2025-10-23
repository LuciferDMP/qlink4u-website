-- Add avatar_url column to users table if not exists
ALTER TABLE public.users_2025_10_23_12_04 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/images/QLink4U.png';

-- Update existing users to have default avatar
UPDATE public.users_2025_10_23_12_04 
SET avatar_url = '/images/QLink4U.png' 
WHERE avatar_url IS NULL;