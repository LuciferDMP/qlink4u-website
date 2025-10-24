import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { supabase } from '@/integrations/supabase/client'
import AuthModal from '@/components/AuthModal'
import Footer from '@/components/Footer'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Loading from '@/components/Loading'
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
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Settings
} from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  
  // State
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Form state
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkMasking, setLinkMasking] = useState(false)
  const [password, setPassword] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [maxClicks, setMaxClicks] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Generate random alias
  const generateAlias = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Create link
  const createLink = async () => {
    if (!url) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập URL cần rút gọn",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const alias = customAlias || generateAlias()
      
      console.log('=== CREATE LINK DEBUG ===')
      console.log('Original URL:', url)
      console.log('Custom Alias:', customAlias)
      console.log('Generated/Final Alias:', alias)
      console.log('User ID:', user?.id)
      
      // Check if alias already exists
      const { data: existingLink } = await supabase
        .from('links_2025_10_23_12_04')
        .select('alias')
        .eq('alias', alias)
        .single()

      if (existingLink) {
        throw new Error('Alias đã tồn tại, vui lòng chọn alias khác')
      }

      const linkData = {
        alias,
        destination_url: url,
        title: title || null,
        description: description || null,
        link_type: linkMasking ? 'masking' : 'redirect',
        password_hash: password || null,
        expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
        max_clicks: maxClicks ? parseInt(maxClicks) : null,
        user_id: user?.id || null,
      }

      console.log('=== LINK DATA TO INSERT ===')
      console.log('Link Data:', JSON.stringify(linkData, null, 2))

      const insertPromise = supabase
        .from('links_2025_10_23_12_04')
        .insert([linkData])
        .select()
        .single()

      const { data, error } = await insertPromise

      console.log('=== SUPABASE INSERT RESULT ===')
      console.log('Inserted Data:', JSON.stringify(data, null, 2))
      console.log('Error:', error)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      toast({
        title: "Thành công!",
        description: `Link rút gọn đã được tạo: ${alias}`,
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
      console.error('Create link error:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo link. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép!",
      description: "Link đã được sao chép vào clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/images/QLink4U.png" alt="QLink4u Logo" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-primary">{t('header.brand')}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">{t('header.dashboard')}</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost">{t('header.profile')}</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost">{t('header.settings')}</Button>
                </Link>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>
                {t('header.login')} / {t('header.register')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('home.subtitle')}
            </p>
            
            {/* URL Shortener Form */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>{t('home.createLink')}</CardTitle>
                <CardDescription>
                  {t('home.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL cần rút gọn *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Alias tùy chỉnh (tùy chọn)</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      qlink4u.com/
                    </span>
                    <Input
                      id="alias"
                      placeholder="my-link"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                  <Label htmlFor="advanced">Tùy chọn nâng cao</Label>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
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
                        <Label htmlFor="maxClicks">Giới hạn click</Label>
                        <Input
                          id="maxClicks"
                          type="number"
                          placeholder="Số lần click tối đa"
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="masking"
                        checked={linkMasking}
                        onCheckedChange={setLinkMasking}
                      />
                      <Label htmlFor="masking">Che link (Link masking)</Label>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={createLink} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Đang tạo..." : "Tạo link rút gọn"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tốc độ cao</h3>
              <p className="text-gray-600">Redirect nhanh chóng, không delay</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bảo mật</h3>
              <p className="text-gray-600">Mật khẩu bảo vệ, hết hạn tự động</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thống kê</h3>
              <p className="text-gray-600">Theo dõi clicks, analytics chi tiết</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chia sẻ</h3>
              <p className="text-gray-600">QR code, social media, embed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-primary-foreground/80">Links được tạo</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-primary-foreground/80">Người dùng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-foreground/80">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Tạo tài khoản miễn phí và bắt đầu rút gọn links ngay hôm nay
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowAuthModal(true)}
            className="text-lg px-8 py-3"
          >
            Đăng ký miễn phí
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}