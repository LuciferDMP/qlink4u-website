import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { 
  Link as LinkIcon, 
  BarChart3, 
  Copy, 
  Edit, 
  Trash2, 
  ExternalLink,
  QrCode,
  Share2,
  Crown,
  Plus,
  Eye,
  Calendar,
  MousePointer
} from 'lucide-react'

interface LinkData {
  id: string
  alias: string
  destination_url: string
  link_type: 'redirect' | 'masking'
  title?: string
  description?: string
  current_clicks: number
  expires_at?: string
  max_clicks?: number
  created_at: string
  is_active: boolean
}

interface UserData {
  user_type: 'personal' | 'business'
  subscription_status: 'active' | 'inactive' | 'cancelled'
  links_limit: number
}

export default function Dashboard() {
  const [links, setLinks] = useState<LinkData[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingLink, setEditingLink] = useState<LinkData | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchUserData()
    fetchLinks()
  }, [user, navigate])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users_2025_10_23_12_04')
        .select('user_type, subscription_status, links_limit')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserData(data)
    } catch (error: any) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links_2025_10_23_12_04')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLinks(data || [])
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách link",
        variant: "destructive",
      })
    } finally {
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

  const shareLink = async (alias: string, title?: string) => {
    const shareUrl = `https://qlink4u.com/${alias}`
    const shareText = title ? `${title}: ${shareUrl}` : `Xem link này: ${shareUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'QLink4u', text: shareText, url: shareUrl })
      } catch (error) {
        copyToClipboard(shareText)
      }
    } else {
      copyToClipboard(shareText)
    }
  }

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('links_2025_10_23_12_04')
        .delete()
        .eq('id', linkId)

      if (error) throw error

      setLinks(links.filter(link => link.id !== linkId))
      toast({
        title: "Thành công",
        description: "Link đã được xóa",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa link",
        variant: "destructive",
      })
    }
  }

  const updateLink = async () => {
    if (!editingLink) return

    try {
      const { error } = await supabase
        .from('links_2025_10_23_12_04')
        .update({
          destination_url: editUrl,
          title: editTitle || null,
          description: editDescription || null,
        })
        .eq('id', editingLink.id)

      if (error) throw error

      // Update local state
      setLinks(links.map(link => 
        link.id === editingLink.id 
          ? { ...link, destination_url: editUrl, title: editTitle, description: editDescription }
          : link
      ))

      setEditingLink(null)
      setEditUrl('')
      setEditTitle('')
      setEditDescription('')

      toast({
        title: "Thành công",
        description: "Link đã được cập nhật",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật link",
        variant: "destructive",
      })
    }
  }

  const startEdit = (link: LinkData) => {
    setEditingLink(link)
    setEditUrl(link.destination_url)
    setEditTitle(link.title || '')
    setEditDescription(link.description || '')
  }

  const upgradeToBusinessPlan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('handle_payment_2025_10_23_12_04', {
        body: {
          action: 'create_subscription',
          userId: user?.id,
          email: user?.email,
        }
      })

      if (error) throw error

      // Redirect to Stripe checkout or handle payment
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <LinkIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">QLink4u.com</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/">
                <Plus className="w-4 h-4 mr-2" />
                Tạo link mới
              </Link>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">Hồ sơ</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">Cài đặt</Link>
              </Button>
              <img 
                src={user?.user_metadata?.avatar_url} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{user?.user_metadata?.full_name}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Info & Upgrade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {userData?.user_type === 'business' && <Crown className="w-5 h-5 text-yellow-500" />}
                Tài khoản {userData?.user_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Số link đã tạo: <span className="font-medium">{links.length}</span>
                  {userData?.links_limit !== -1 && (
                    <span> / {userData?.links_limit}</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Trạng thái: <Badge variant={userData?.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {userData?.subscription_status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </p>
              </div>
              
              {userData?.user_type === 'personal' && (
                <Button 
                  className="w-full mt-4 gradient-primary text-white"
                  onClick={upgradeToBusinessPlan}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Nâng cấp Doanh nghiệp
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Tổng lượt click
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {links.reduce((total, link) => total + link.current_clicks, 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Từ {links.length} link
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Link hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {links.filter(link => link.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">
                Link đang hoạt động
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách link của bạn</CardTitle>
            <CardDescription>
              Quản lý và theo dõi tất cả các link rút gọn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Chưa có link nào</h3>
                <p className="text-muted-foreground mb-4">
                  Tạo link rút gọn đầu tiên của bạn
                </p>
                <Button asChild>
                  <Link to="/">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo link mới
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link rút gọn</TableHead>
                    <TableHead>URL đích</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            qlink4u.com/{link.alias}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(`https://qlink4u.com/${link.alias}`)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {link.title && (
                          <p className="text-sm font-medium mt-1">{link.title}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={link.destination_url}>
                          {link.destination_url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={link.link_type === 'masking' ? 'default' : 'secondary'}>
                          {link.link_type === 'masking' ? 'Che link' : 'Chuyển hướng'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{link.current_clicks}</span>
                          {link.max_clicks && (
                            <span className="text-muted-foreground">/ {link.max_clicks}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(link.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={link.is_active ? 'default' : 'destructive'}>
                          {link.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                        {link.expires_at && new Date(link.expires_at) < new Date() && (
                          <Badge variant="destructive" className="ml-1">Hết hạn</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://qlink4u.com/${link.alias}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateQRCode(link.alias)}
                          >
                            <QrCode className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => shareLink(link.alias, link.title)}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link to={`/analytics/${link.id}`}>
                              <BarChart3 className="w-3 h-3" />
                            </Link>
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(link)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Chỉnh sửa link</DialogTitle>
                                <DialogDescription>
                                  Bạn chỉ có thể chỉnh sửa URL đích và thông tin mô tả
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-url">URL đích *</Label>
                                  <Input
                                    id="edit-url"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-title">Tiêu đề</Label>
                                  <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-description">Mô tả</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setEditingLink(null)}>
                                    Hủy
                                  </Button>
                                  <Button onClick={updateLink}>
                                    Cập nhật
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa link này?')) {
                                deleteLink(link.id)
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}