import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { 
  ArrowLeft,
  User, 
  Edit, 
  Save,
  Crown,
  Calendar,
  Link as LinkIcon,
  MousePointer,
  BarChart3
} from 'lucide-react'

interface UserProfile {
  full_name: string
  bio: string
  website: string
  location: string
}

interface UserStats {
  total_links: number
  total_clicks: number
  active_links: number
  created_at: string
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    bio: '',
    website: '',
    location: ''
  })
  const [stats, setStats] = useState<UserStats>({
    total_links: 0,
    total_clicks: 0,
    active_links: 0,
    created_at: ''
  })
  const [editing, setEditing] = useState(false)
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
    fetchUserStats()
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
      setProfile({
        full_name: data.full_name || user?.user_metadata?.full_name || '',
        bio: data.bio || '',
        website: data.website || '',
        location: data.location || ''
      })
      
      setStats(prev => ({
        ...prev,
        created_at: data.created_at
      }))
    } catch (error: any) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // Get links count
      const { data: linksData, error: linksError } = await supabase
        .from('links_2025_10_23_12_04')
        .select('id, current_clicks, is_active')
        .eq('user_id', user?.id)

      if (linksError) throw linksError

      const totalLinks = linksData?.length || 0
      const activeLinks = linksData?.filter(link => link.is_active).length || 0
      const totalClicks = linksData?.reduce((sum, link) => sum + (link.current_clicks || 0), 0) || 0

      setStats(prev => ({
        ...prev,
        total_links: totalLinks,
        active_links: activeLinks,
        total_clicks: totalClicks
      }))
    } catch (error: any) {
      console.error('Error fetching user stats:', error)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('users_2025_10_23_12_04')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          location: profile.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setEditing(false)
      toast({
        title: "Hồ sơ đã được cập nhật",
        description: "Thông tin của bạn đã được lưu thành công",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
              <h1 className="text-xl font-bold">Hồ sơ cá nhân</h1>
              <p className="text-sm text-muted-foreground">
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link to="/settings">Cài đặt</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <img 
                    src={user.user_metadata?.avatar_url} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full mx-auto"
                  />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {profile.full_name || user.user_metadata?.full_name}
                  {userData?.user_type === 'business' && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <div className="flex justify-center">
                  <Badge variant={userData?.user_type === 'business' ? 'default' : 'secondary'}>
                    {userData?.user_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Tham gia {new Date(stats.created_at).toLocaleDateString('vi-VN')}
                </div>
                
                {profile.location && (
                  <div className="text-sm">
                    📍 {profile.location}
                  </div>
                )}
                
                {profile.website && (
                  <div className="text-sm">
                    🌐 <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                
                {profile.bio && (
                  <div className="text-sm text-muted-foreground">
                    {profile.bio}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng links</CardTitle>
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_links}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_links} đang hoạt động
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_clicks}</div>
                  <p className="text-xs text-muted-foreground">
                    Từ tất cả links
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_links > 0 ? Math.round(stats.total_clicks / stats.total_links) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clicks/link
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Edit Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Thông tin cá nhân
                    </CardTitle>
                    <CardDescription>
                      Cập nhật thông tin hồ sơ của bạn
                    </CardDescription>
                  </div>
                  <Button
                    variant={editing ? "default" : "outline"}
                    onClick={() => editing ? saveProfile() : setEditing(true)}
                    disabled={loading}
                  >
                    {editing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Đang lưu...' : 'Lưu'}
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Họ và tên</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Vị trí</Label>
                    <Input
                      id="location"
                      placeholder="Hà Nội, Việt Nam"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Giới thiệu</Label>
                  <Textarea
                    id="bio"
                    placeholder="Viết vài dòng về bản thân..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!editing}
                    rows={3}
                  />
                </div>
                
                {editing && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Hủy
                    </Button>
                    <Button onClick={saveProfile} disabled={loading}>
                      {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}