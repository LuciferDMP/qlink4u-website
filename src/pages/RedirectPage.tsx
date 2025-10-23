import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Lock, AlertTriangle } from 'lucide-react'

export default function RedirectPage() {
  const { alias } = useParams()
  const [loading, setLoading] = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    // If alias is a system route, redirect to 404
    if (!alias || alias === 'dashboard' || alias === 'analytics' || alias.includes('/')) {
      setError('Trang không tồn tại')
      setLoading(false)
      return
    }
    
    if (alias) {
      handleRedirect()
    }
  }, [alias])

  const handleRedirect = async (providedPassword?: string) => {
    try {
      setLoading(true)
      setError('')

      // First, get the link data from database
      const { data: linkData, error: linkError } = await supabase
        .from('links_2025_10_23_12_04')
        .select('*')
        .eq('alias', alias)
        .eq('is_active', true)
        .single()

      if (linkError || !linkData) {
        setError('Link không tồn tại hoặc đã bị vô hiệu hóa')
        setLoading(false)
        return
      }

      // Check if link has expired
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setError('Link đã hết hạn')
        setLoading(false)
        return
      }

      // Check click limit
      if (linkData.max_clicks && linkData.current_clicks >= linkData.max_clicks) {
        setError('Link đã đạt giới hạn số lần truy cập')
        setLoading(false)
        return
      }

      // Check password
      if (linkData.password_hash && !providedPassword) {
        setRequiresPassword(true)
        setLoading(false)
        return
      }

      if (linkData.password_hash && providedPassword !== linkData.password_hash) {
        setError('Mật khẩu không đúng')
        setLoading(false)
        return
      }

      // Record click analytics (simplified version)
      try {
        await supabase
          .from('clicks_2025_10_23_12_04')
          .insert({
            link_id: linkData.id,
            ip_address: '127.0.0.1', // Placeholder
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: getBrowserName(),
            os: getOSName()
          })
      } catch (error) {
        console.error('Error recording click:', error)
      }

      // Handle redirect based on link type
      if (linkData.link_type === 'masking') {
        // For masking, create iframe content
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
                  src="${linkData.destination_url}" 
                  onload="document.getElementById('loading').style.display='none'"
                  onerror="document.getElementById('loading').innerHTML='<div>Không thể tải nội dung. <a href=\\"${linkData.destination_url}\\" target=\\"_blank\\">Nhấp vào đây để mở trực tiếp</a></div>'"
              ></iframe>
          </body>
          </html>
        `
        
        // Replace current page content with masking HTML
        document.open()
        document.write(maskingHtml)
        document.close()
      } else {
        // Regular redirect
        window.location.href = linkData.destination_url
      }
      
    } catch (error: any) {
      setError('Đã xảy ra lỗi khi xử lý link')
      setLoading(false)
    }
  }

  const getBrowserName = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome'
    if (ua.includes('firefox')) return 'firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari'
    if (ua.includes('edg')) return 'edge'
    return 'unknown'
  }

  const getOSName = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('windows')) return 'windows'
    if (ua.includes('mac')) return 'macos'
    if (ua.includes('linux')) return 'linux'
    if (ua.includes('android')) return 'android'
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    return 'unknown'
  }

  const submitPassword = () => {
    if (!password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu",
        variant: "destructive",
      })
      return
    }
    
    handleRedirect(password)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Link được bảo vệ</CardTitle>
            <p className="text-muted-foreground">
              Link này yêu cầu mật khẩu để truy cập
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitPassword()}
              />
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              onClick={submitPassword} 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Truy cập'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Không thể truy cập link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}