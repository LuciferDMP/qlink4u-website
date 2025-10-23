import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      const { action, userId, email } = await req.json()

      if (action === 'create_subscription') {
        // Create Stripe customer
        const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: email,
            'metadata[user_id]': userId,
          }),
        })

        if (!customerResponse.ok) {
          throw new Error(`Stripe customer creation failed: ${customerResponse.status}`)
        }

        const customer = await customerResponse.json()

        // Create subscription
        const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: customer.id,
            'items[0][price]': 'price_1234567890', // Replace with actual price ID
            'payment_behavior': 'default_incomplete',
            'payment_settings[save_default_payment_method]': 'on_subscription',
            'expand[0]': 'latest_invoice.payment_intent',
          }),
        })

        if (!subscriptionResponse.ok) {
          throw new Error(`Stripe subscription creation failed: ${subscriptionResponse.status}`)
        }

        const subscription = await subscriptionResponse.json()

        // Save subscription to database
        const { error: dbError } = await supabase
          .from('subscriptions_2025_10_23_12_04')
          .insert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customer.id,
            status: 'inactive',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })

        if (dbError) {
          console.error('Database error:', dbError)
          throw new Error('Failed to save subscription')
        }

        return new Response(
          JSON.stringify({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (action === 'confirm_payment') {
        const { subscriptionId } = await req.json()

        // Get subscription from Stripe
        const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        })

        if (!subscriptionResponse.ok) {
          throw new Error('Failed to fetch subscription')
        }

        const subscription = await subscriptionResponse.json()

        if (subscription.status === 'active') {
          // Update user and subscription status
          const { error: userError } = await supabase
            .from('users_2025_10_23_12_04')
            .update({
              user_type: 'business',
              subscription_status: 'active',
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              links_limit: -1, // Unlimited for business users
            })
            .eq('id', userId)

          const { error: subError } = await supabase
            .from('subscriptions_2025_10_23_12_04')
            .update({
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (userError || subError) {
            console.error('Database update error:', userError || subError)
            throw new Error('Failed to update subscription status')
          }

          return new Response(
            JSON.stringify({ success: true, status: 'active' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ success: false, status: subscription.status }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (action === 'cancel_subscription') {
        const { subscriptionId } = await req.json()

        // Cancel subscription in Stripe
        const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        })

        if (!cancelResponse.ok) {
          throw new Error('Failed to cancel subscription')
        }

        // Update database
        const { error: userError } = await supabase
          .from('users_2025_10_23_12_04')
          .update({
            user_type: 'personal',
            subscription_status: 'cancelled',
            links_limit: 10,
          })
          .eq('id', userId)

        const { error: subError } = await supabase
          .from('subscriptions_2025_10_23_12_04')
          .update({
            status: 'cancelled',
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (userError || subError) {
          console.error('Database update error:', userError || subError)
          throw new Error('Failed to update cancellation status')
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in payment function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})