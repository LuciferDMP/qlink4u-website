import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/integrations/supabase/client'
import { 
  Link as LinkIcon, 
  Zap, 
  Shield, 
  BarChart3, 
  Share2, 
  QrCode,
  Github,
  Chrome,
  Apple,
  Monitor,
  Copy,
  ExternalLink
} from 'lucide-react'

interface CreatedLink {
  id: string
  alias: string
  destination_url: string
  link_type: 'redirect' | 'masking'
  created_at: string
}

export default function Index() {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkMasking, setLinkMasking] = useState(false)
  const [password, setPassword] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [maxClicks, setMaxClicks] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const { user, signInWithOAuth, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Ensure user profile exists using Edge Function
  const ensureUserProfile = async (user: any) => {
    try {
      console.log('Calling Edge Function for user profile...')
      
      const { data, error } = await supabase.functions.invoke('ensure_user_profile_2025_10_23_15_12', {
        body: {
          action: 'ensure_user_profile',
          userId: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name
        }
      })

      console.log('Edge Function response:', { data, error })

      if (error) {
        console.error('Edge function error:', error)
        // Don't throw error, just log it and continue
        return null
      }

      console.log('User profile ensured successfully')
      return data
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      // Don't throw error, just log it and continue
      return null
    }
  }

  const createLink = async () => {
    console.log('=== CREATE LINK STARTED ===')
    if (!url) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập URL cần rút gọn",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    console.log('Creating link with user:', user?.id)
    try {
      // Generate random alias if not provided
      const alias = customAlias || Math.random().toString(36).substring(2, 8)
      console.log('Using alias:', alias)
      // Check if alias already exists
      const { data: existingLink } = await supabase
        .from('links_2025_10_23_12_04')
        .select('id')
        .eq('alias', alias)
        .single()

      if (existingLink) {
        toast({
          title: "Lỗi",
          description: "Bí danh này đã được sử dụng. Vui lòng chọn bí danh khác.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create user profile first if user is logged in
      if (user) {
        console.log('Creating user profile for:', user.id)
        try {
          // Direct insert with upsert to ensure user exists
          const { error: userError } = await supabase
            .from('users_2025_10_23_12_04')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              user_type: 'personal',
              links_limit: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: true 
            })
          
          if (userError) {
            console.error('User profile creation error:', userError)
            // Continue anyway, but set user_id to null
          } else {
            console.log('User profile created/updated successfully')
          }
        } catch (error) {
          console.error('User profile creation failed:', error)
        }
      }
      // Create link data - use real user_id now that profile exists
      const linkData: any = {
        alias,
        destination_url: url,
        link_type: linkMasking ? 'masking' : 'redirect',
        title: title || null,
        description: description || null,
        user_id: user?.id || null, // Use real user_id
      }

      // Add security features if provided
      if (password) {
        linkData.password_hash = password // In production, hash this
      }
      if (expiryDate) {
        linkData.expires_at = new Date(expiryDate).toISOString()
      }
      if (maxClicks) {
        linkData.max_clicks = parseInt(maxClicks)
      }

      console.log('Creating link with data:', linkData)
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const insertPromise = supabase
        .from('links_2025_10_23_12_04')
        .insert(linkData)
        .select()
        .single()
      
      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any

      console.log('Supabase response:', { data, error })
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setCreatedLink(data)
      toast({
        title: "Thành công!",
        description: "Link đã được tạo thành công",
      })

      // Reset form
      setUrl('')
      setCustomAlias('')
      setTitle('')
      setDescription('')
      setPassword('')
      setExpiryDate('')
      setMaxClicks('')
      setShowAdvanced(false)

    } catch (error: any) {
      console.error('=== CREATE LINK ERROR ===', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo link. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      console.log('=== CREATE LINK FINISHED ===')
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép!",
      description: "Link đã được sao chép vào clipboard",
    })
  }

  const generateQRCode = (alias: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://qlink4u.com/${alias}`)}`
    window.open(qrUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="./images/QLink4U.png" alt="QLink4u Logo" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-primary">QLink4u.com</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.user_metadata?.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium">{user.user_metadata?.full_name}</span>
                </div>
                <Button variant="ghost" onClick={signOut}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                  Đăng nhập
                </Button>
                <Button onClick={() => setShowAuthModal(true)}>
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rút gọn link chuyên nghiệp
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tạo link rút gọn với tính năng che link, thống kê chi tiết, bảo mật nâng cao và nhiều tính năng khác
          </p>

          {/* Link Creation Form */}
          <Card className="max-w-2xl mx-auto shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Tạo link rút gọn
              </CardTitle>
              <CardDescription>
                Nhập URL bạn muốn rút gọn và tùy chỉnh các tính năng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">URL gốc *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/very-long-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias">Bí danh tùy chỉnh (tùy chọn)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    qlink4u.com/
                  </span>
                  <Input
                    id="alias"
                    placeholder="ten-cua-ban"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="masking"
                  checked={linkMasking}
                  onCheckedChange={setLinkMasking}
                />
                <Label htmlFor="masking" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Che link (Link Masking)
                </Label>
              </div>
              {linkMasking && (
                <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md">
                  ⚠️ Tính năng che link sẽ hiển thị nội dung trang đích trong iframe mà không thay đổi URL trên thanh địa chỉ. 
                  Lưu ý: Một số trang web có thể chặn việc hiển thị trong iframe.
                </p>
              )}

              <Button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                variant="outline" 
                className="w-full"
              >
                {showAdvanced ? 'Ẩn' : 'Hiện'} tùy chọn nâng cao
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tiêu đề</Label>
                      <Input
                        id="title"
                        placeholder="Tiêu đề link"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu bảo vệ</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mật khẩu (tùy chọn)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      placeholder="Mô tả về link này"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Ngày hết hạn</Label>
                      <Input
                        id="expiry"
                        type="datetime-local"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxClicks">Giới hạn số lần click</Label>
                      <Input
                        id="maxClicks"
                        type="number"
                        placeholder="Số lần click tối đa"
                        value={maxClicks}
                        onChange={(e) => setMaxClicks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={createLink} 
                disabled={loading} 
                className="w-full gradient-primary text-white"
              >
                {loading ? 'Đang tạo...' : 'Tạo link rút gọn'}
              </Button>
            </CardContent>
          </Card>

          {/* Created Link Display */}
          {createdLink && (
            <Card className="max-w-2xl mx-auto mt-6 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-green-600">Link đã được tạo thành công!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-left">
                    https://qlink4u.com/{createdLink.alias}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`https://qlink4u.com/${createdLink.alias}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://qlink4u.com/${createdLink.alias}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => generateQRCode(createdLink.alias)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Tạo QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const shareUrl = `https://qlink4u.com/${createdLink.alias}`
                      const shareText = `Xem link này: ${shareUrl}`
                      if (navigator.share) {
                        navigator.share({ title: 'QLink4u', text: shareText, url: shareUrl })
                      } else {
                        copyToClipboard(shareText)
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>

                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <Badge variant={createdLink.link_type === 'masking' ? 'default' : 'secondary'}>
                    {createdLink.link_type === 'masking' ? 'Che link' : 'Chuyển hướng'}
                  </Badge>
                  <span>Tạo lúc: {new Date(createdLink.created_at).toLocaleString('vi-VN')}</span>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tính năng nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Bảo mật nâng cao</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Mật khẩu bảo vệ, giới hạn thời gian và số lần truy cập
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Thống kê chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Theo dõi clicks, thiết bị, vị trí địa lý và nhiều hơn nữa
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <LinkIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Che link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Giữ nguyên URL trên thanh địa chỉ khi hiển thị nội dung
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Share2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Chia sẻ dễ dàng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  QR code, chia sẻ mạng xã hội và email
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Gói dịch vụ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Cá nhân</CardTitle>
                <CardDescription>Miễn phí</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Tối đa 10 link</li>
                  <li>✓ Thống kê cơ bản</li>
                  <li>✓ Tính năng che link</li>
                  <li>✓ Bảo mật cơ bản</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Doanh nghiệp</CardTitle>
                <CardDescription>99,000đ/tháng</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Không giới hạn link</li>
                  <li>✓ Thống kê chi tiết</li>
                  <li>✓ Tất cả tính năng bảo mật</li>
                  <li>✓ Hỗ trợ ưu tiên</li>
                  <li>✓ API truy cập</li>
                </ul>
                <Button className="w-full mt-4 gradient-primary text-white">
                  Nâng cấp ngay
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <LinkIcon className="h-8 w-8" />
            <span className="text-2xl font-bold">QLink4u.com</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 QLink4u.com. Dịch vụ rút gọn link chuyên nghiệp.</p>
          </div>
        </div>
      </footer>
      
      {/* AuthModal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}