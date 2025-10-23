import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

// Helper function to determine from email
function getFromEmail() {
  const domain = Deno.env.get('RESEND_DOMAIN')
  if (domain) {
    return `send@${domain}`
  }
  return 'onboarding@resend.dev' // Default fallback
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      const { action, email, linkData, recipientEmails, message } = await req.json()

      if (action === 'share_link') {
        // Share link via email
        const emailSubject = `Chia sẻ link từ QLink4u.com`
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bạn nhận được một link được chia sẻ</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${linkData.title || 'Link được chia sẻ'}</h3>
              <p style="margin: 0 0 15px 0; color: #666;">${linkData.description || ''}</p>
              <a href="https://qlink4u.com/${linkData.alias}" 
                 style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Truy cập link
              </a>
            </div>
            ${message ? `<div style="margin: 20px 0;"><strong>Tin nhắn:</strong><p style="color: #666;">${message}</p></div>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Email này được gửi từ QLink4u.com - Dịch vụ rút gọn link chuyên nghiệp
            </p>
          </div>
        `

        // Send email to multiple recipients
        for (const recipientEmail of recipientEmails) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: getFromEmail(),
              to: recipientEmail,
              subject: emailSubject,
              html: emailBody,
              text: emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
            })
          })

          if (!response.ok) {
            console.error(`Failed to send email to ${recipientEmail}:`, await response.text())
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Emails sent successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (action === 'send_notification') {
        // Send notification email (e.g., subscription confirmation, link expiry warning)
        const { type, userEmail, data } = await req.json()

        let emailSubject = ''
        let emailBody = ''

        switch (type) {
          case 'subscription_confirmed':
            emailSubject = 'Chúc mừng! Tài khoản doanh nghiệp đã được kích hoạt'
            emailBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Tài khoản doanh nghiệp đã được kích hoạt!</h2>
                <p>Chúc mừng bạn đã nâng cấp thành công lên tài khoản doanh nghiệp QLink4u.com.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Quyền lợi của bạn:</h3>
                  <ul>
                    <li>Tạo không giới hạn số lượng link</li>
                    <li>Thống kê chi tiết và chuyên nghiệp</li>
                    <li>Tính năng bảo mật nâng cao</li>
                    <li>Hỗ trợ ưu tiên</li>
                  </ul>
                </div>
                <a href="https://qlink4u.com/dashboard" 
                   style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Truy cập Dashboard
                </a>
              </div>
            `
            break

          case 'link_expiry_warning':
            emailSubject = 'Cảnh báo: Link của bạn sắp hết hạn'
            emailBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ffc107;">Link sắp hết hạn</h2>
                <p>Link <strong>${data.alias}</strong> của bạn sẽ hết hạn vào ${new Date(data.expires_at).toLocaleDateString('vi-VN')}.</p>
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <p><strong>Link:</strong> https://qlink4u.com/${data.alias}</p>
                  <p><strong>Đích đến:</strong> ${data.destination_url}</p>
                  <p><strong>Hết hạn:</strong> ${new Date(data.expires_at).toLocaleString('vi-VN')}</p>
                </div>
                <a href="https://qlink4u.com/dashboard" 
                   style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Gia hạn link
                </a>
              </div>
            `
            break

          default:
            return new Response(
              JSON.stringify({ error: 'Unknown notification type' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: getFromEmail(),
            to: userEmail,
            subject: emailSubject,
            html: emailBody,
            text: emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
          })
        })

        if (!response.ok) {
          throw new Error(`Resend API error: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        return new Response(
          JSON.stringify({ success: true, message_id: result.id }),
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
    console.error('Error in email function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})