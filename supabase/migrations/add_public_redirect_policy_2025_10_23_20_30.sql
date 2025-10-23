-- Add policy to allow public access for link redirects
-- This allows Service Worker to read links for redirecting without authentication
CREATE POLICY "links_public_redirect" ON public.links_2025_10_23_12_04
  FOR SELECT 
  USING (true);  -- Allow all reads for redirect purposes

-- This policy has lower priority than user-specific policies
-- but allows Service Worker to access any link for redirecting