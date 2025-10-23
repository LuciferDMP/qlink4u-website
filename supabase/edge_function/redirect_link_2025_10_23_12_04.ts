import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

interface LinkData {
  id: string
  destination_url: string
  link_type: 'redirect' | 'masking'
  password_hash?: string
  expires_at?: string
  max_clicks?: number
  current_clicks: number
  is_active: boolean
  allowed_countries?: string[]
}

interface GeolocationData {
  country_code?: string
  country_name?: string
  city?: string
  region_name?: string
}

// Function to get geolocation from IP
async function getGeolocation(ip: string): Promise<GeolocationData> {
  try {
    // Using ipapi.co as a free geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    if (response.ok) {
      const data = await response.json()
      return {
        country_code: data.country_code,
        country_name: data.country_name,
        city: data.city,
        region_name: data.region_name
      }
    }
  } catch (error) {
    console.error('Geolocation error:', error)
  }
  return {}
}

// Function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  // Device type detection
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  // Browser detection
  let browser = 'unknown'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome'
  else if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari'
  else if (ua.includes('edg')) browser = 'edge'
  else if (ua.includes('opera')) browser = 'opera'
  
  // OS detection
  let os = 'unknown'
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('mac')) os = 'macos'
  else if (ua.includes('linux')) os = 'linux'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios'
  
  return { deviceType, browser, os }
}

// Function to check if password is required and valid
async function checkPassword(linkData: LinkData, providedPassword?: string): Promise<boolean> {
  if (!linkData.password_hash) return true
  
  if (!providedPassword) return false
  
  // Simple password check (in production, use proper hashing)
  return linkData.password_hash === providedPassword
}

// Function to check if link is accessible from country
function checkGeoRestriction(linkData: LinkData, countryCode?: string): boolean {
  if (!linkData.allowed_countries || linkData.allowed_countries.length === 0) return true
  if (!countryCode) return true
  
  return linkData.allowed_countries.includes(countryCode)
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

    const url = new URL(req.url)
    const alias = url.searchParams.get('alias')
    const password = url.searchParams.get('password')
    
    if (!alias) {
      return new Response(
        JSON.stringify({ error: 'Alias is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get link data
    const { data: linkData, error: linkError } = await supabase
      .from('links_2025_10_23_12_04')
      .select('*')
      .eq('alias', alias)
      .eq('is_active', true)
      .single()

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const link = linkData as LinkData

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Link has expired' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check click limit
    if (link.max_clicks && link.current_clicks >= link.max_clicks) {
      return new Response(
        JSON.stringify({ error: 'Link has reached maximum clicks' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''
    const referrer = req.headers.get('referer') || ''

    // Get geolocation data
    const geoData = await getGeolocation(clientIP)
    
    // Check geo restrictions
    if (!checkGeoRestriction(link, geoData.country_code)) {
      return new Response(
        JSON.stringify({ error: 'Access denied from your location' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check password
    if (!await checkPassword(link, password)) {
      return new Response(
        JSON.stringify({ error: 'Password required', requiresPassword: true }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(userAgent)

    // Record click analytics
    const { error: clickError } = await supabase
      .from('clicks_2025_10_23_12_04')
      .insert({
        link_id: link.id,
        ip_address: clientIP,
        user_agent: userAgent,
        referrer: referrer,
        country: geoData.country_code,
        city: geoData.city,
        device_type: deviceType,
        browser: browser,
        os: os
      })

    if (clickError) {
      console.error('Error recording click:', clickError)
    }

    // Return response based on link type
    if (link.link_type === 'masking') {
      // Return masking page HTML
      const maskingHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>QLink4u.com</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body, html { 
                    margin: 0; 
                    padding: 0; 
                    height: 100%; 
                    overflow: hidden; 
                    font-family: Arial, sans-serif;
                }
                iframe { 
                    width: 100%; 
                    height: 100%; 
                    border: none; 
                }
                .error-message {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #f5f5f5;
                    color: #666;
                    text-align: center;
                }
                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #f5f5f5;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="loading" id="loading">
                <div>Đang tải...</div>
            </div>
            <iframe 
                src="${link.destination_url}" 
                onload="document.getElementById('loading').style.display='none'"
                onerror="document.getElementById('loading').innerHTML='<div class=\\"error-message\\"><div>Không thể tải nội dung. <a href=\\"${link.destination_url}\\" target=\\"_blank\\">Nhấp vào đây để mở trực tiếp</a></div></div>'"
            ></iframe>
        </body>
        </html>
      `
      
      return new Response(maskingHtml, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      })
    } else {
      // Return redirect response
      return new Response(null, {
        status: 301,
        headers: { 
          ...corsHeaders, 
          'Location': link.destination_url 
        }
      })
    }

  } catch (error) {
    console.error('Error in redirect function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})