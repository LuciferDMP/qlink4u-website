import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vnmdlqgibiemwgfduzvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZubWRscWdpYmllbXdnZmR1enZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDczMjYsImV4cCI6MjA3NjQyMzMyNn0.wxkjuFMQ6T2oSSDtFrSt5BMay1TRqmVzSeFVosvHRKk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
