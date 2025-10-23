import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE USER PROFILE START ===')
    
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { userId, email, fullName } = requestBody

    if (!userId || !email) {
      throw new Error('Missing required fields: userId and email')
    }

    console.log('Creating profile for user:', userId, email)

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users_2025_10_23_12_04')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    console.log('Existing user check:', { existingUser, selectError })

    if (existingUser) {
      console.log('User already exists, skipping creation')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User profile already exists',
          data: existingUser 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create new user profile with default avatar
    const newUserData = {
      id: userId,
      email: email,
      full_name: fullName || email?.split('@')[0] || 'User',
      user_type: 'personal',
      links_limit: 10,
      avatar_url: '/images/QLink4U.png', // Default avatar
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Inserting new user:', newUserData)

    const { data: newUser, error: insertError } = await supabase
      .from('users_2025_10_23_12_04')
      .insert(newUserData)
      .select()
      .single()

    console.log('Insert result:', { newUser, insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    console.log('=== CREATE USER PROFILE SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User profile created successfully',
        data: newUser 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('=== CREATE USER PROFILE ERROR ===', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})