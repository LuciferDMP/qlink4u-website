import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DEBUG USER CREATION ===')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Environment check:')
    console.log('- SUPABASE_URL:', supabaseUrl)
    console.log('- SERVICE_KEY exists:', !!supabaseServiceKey)
    console.log('- SERVICE_KEY length:', supabaseServiceKey?.length)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test 1: Check table exists and structure
    console.log('\n=== TEST 1: TABLE STRUCTURE ===')
    const { data: tableInfo, error: tableError } = await supabase
      .from('users_2025_10_23_12_04')
      .select('*')
      .limit(1)

    console.log('Table query result:', { tableInfo, tableError })

    // Test 2: Check RLS policies
    console.log('\n=== TEST 2: RLS POLICIES ===')
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'users_2025_10_23_12_04'` 
      })
      .single()

    console.log('RLS policies:', { policies, policyError })

    // Test 3: Try direct insert with service role
    console.log('\n=== TEST 3: DIRECT INSERT TEST ===')
    const testUserId = crypto.randomUUID()
    const testUserData = {
      id: testUserId,
      email: 'test@debug.com',
      full_name: 'Debug Test User',
      user_type: 'personal',
      links_limit: 10,
      avatar_url: '/images/QLink4U.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting to insert:', testUserData)

    const { data: insertResult, error: insertError } = await supabase
      .from('users_2025_10_23_12_04')
      .insert(testUserData)
      .select()

    console.log('Insert result:', { insertResult, insertError })

    // Test 4: Clean up test data
    if (insertResult) {
      console.log('\n=== TEST 4: CLEANUP ===')
      const { error: deleteError } = await supabase
        .from('users_2025_10_23_12_04')
        .delete()
        .eq('id', testUserId)
      
      console.log('Cleanup result:', { deleteError })
    }

    // Test 5: Check auth.users table
    console.log('\n=== TEST 5: AUTH USERS CHECK ===')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    console.log('Auth users count:', authUsers?.users?.length)
    console.log('Auth error:', authError)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Debug tests completed - check logs',
        tests: {
          tableStructure: !tableError,
          policies: !policyError,
          directInsert: !insertError,
          authUsers: !authError
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('=== DEBUG ERROR ===', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})