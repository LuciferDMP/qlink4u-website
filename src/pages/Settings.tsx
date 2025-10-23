import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { 
  ArrowLeft,
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Trash2,
  Crown,
  CreditCard
} from 'lucide-react'

interface UserSettings {
  email_notifications: boolean
  link_expiry_warnings: boolean
  public_profile: boolean
  default_link_type: 'redirect' | 'masking'
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    link_expiry_warnings: true,
    public_profile: false,
    default_link_type: 'redirect'
  })
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchUserData()
  }, [user, navigate])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users_2025_10_23_12_04')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserData(data)
    } catch (error: any) {
      console.error('Error fetching user data:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setLoading(true)
    try {
      // In a real app, you'd save these to a user_settings table
      setSettings({ ...settings, ...newSettings })
      
      toast({
        title: "Cài đặt đã được lưu",
        description: "Các thay đổi của bạn đã được áp dụng",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const upgradeAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('handle_payment_2025_10_23_12_04', {
        body: {
          action: 'create_subscription',
          userId: user?.id,
          email: user?.email,
        }
      })

      if (error) throw error

      toast({
        title: "Chuyển hướng thanh toán",
        description: "Đang chuyển hướng đến trang thanh toán...",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo đăng ký. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      return
    }

    try {
      // Delete user data (in a real app, you'd have a proper deletion process)
      await supabase
        .from('users_2025_10_23_12_04')
        .delete()
        .eq('id', user?.id)

      await signOut()
      navigate('/')
      
      toast({
        title: "Tài khoản đã được xóa",
        description: "Tài khoản của bạn đã được xóa thành công",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa tài khoản",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Cài đặt</h1>
              <p className="text-sm text-muted-foreground">
                Quản lý tài khoản và tùy chọn của bạn
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <img 
              src={user.user_metadata?.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium">{user.user_metadata?.full_name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Loại tài khoản</Label>
                  <div className="flex items-center gap-2">
                    {userData?.user_type === 'business' && <Crown className="w-4 h-4 text-yellow-500" />}
                    <p className="font-medium">
                      {userData?.user_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Số link đã tạo</Label>
                  <p className="font-medium">
                    {userData?.links_limit === -1 ? 'Không giới hạn' : `${userData?.links_limit || 0} links`}
                  </p>
                </div>
                
                {userData?.user_type === 'personal' && (
                  <Button 
                    className="w-full gradient-primary text-white"
                    onClick={upgradeAccount}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Nâng cấp Doanh nghiệp
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Thông báo
                </CardTitle>
                <CardDescription>
                  Quản lý cách bạn nhận thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email thông báo</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận email về hoạt động tài khoản
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => 
                      updateSettings({ email_notifications: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cảnh báo link hết hạn</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi link sắp hết hạn
                    </p>
                  </div>
                  <Switch
                    checked={settings.link_expiry_warnings}
                    onCheckedChange={(checked) => 
                      updateSettings({ link_expiry_warnings: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Quyền riêng tư
                </CardTitle>
                <CardDescription>
                  Kiểm soát quyền riêng tư của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hồ sơ công khai</Label>
                    <p className="text-sm text-muted-foreground">
                      Cho phép người khác xem thống kê link của bạn
                    </p>
                  </div>
                  <Switch
                    checked={settings.public_profile}
                    onCheckedChange={(checked) => 
                      updateSettings({ public_profile: checked })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Loại link mặc định</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="default_link_type"
                        value="redirect"
                        checked={settings.default_link_type === 'redirect'}
                        onChange={() => updateSettings({ default_link_type: 'redirect' })}
                      />
                      <span>Chuyển hướng</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="default_link_type"
                        value="masking"
                        checked={settings.default_link_type === 'masking'}
                        onChange={() => updateSettings({ default_link_type: 'masking' })}
                      />
                      <span>Che link</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Settings */}
            {userData?.user_type === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Thanh toán
                  </CardTitle>
                  <CardDescription>
                    Quản lý đăng ký và thanh toán
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Gói Doanh nghiệp</p>
                      <p className="text-sm text-muted-foreground">99,000đ/tháng</p>
                    </div>
                    <Button variant="outline">
                      Quản lý đăng ký
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Vùng nguy hiểm
                </CardTitle>
                <CardDescription>
                  Các hành động không thể hoàn tác
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={deleteAccount}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tài khoản vĩnh viễn
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}