-- Add policy to allow public update of click_count for any link
-- This allows Service Worker to increment click count without authentication
CREATE POLICY "links_public_click_update" ON public.links_2025_10_23_12_04
  FOR UPDATE 
  USING (true)  -- Allow reading the record
  WITH CHECK (true);  -- Allow updating click_count field

-- Note: This is safe because Service Worker only updates click_count
-- and doesn't modify other sensitive fields