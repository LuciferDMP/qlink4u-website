import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Mail, 
  Lock, 
  User,
  Chrome,
  Github,
  Apple,
  Monitor
} from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')
  
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth()
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await signInWithEmail(email, password)
      onClose()
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await signUpWithEmail(email, password, { full_name: fullName })
      onClose()
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'apple' | 'azure') => {
    try {
      await signInWithOAuth(provider)
    } catch (error) {
      toast({
        title: "OAuth chưa được cấu hình",
        description: "Vui lòng sử dụng đăng nhập bằng email tạm thời",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Chào mừng đến QLink4u</CardTitle>
          <CardDescription>
            Đăng nhập để quản lý link rút gọn của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mật khẩu</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Mail className="w-4 h-4 mr-2" />
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Họ và tên</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mật khẩu</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <User className="w-4 h-4 mr-2" />
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn('google')}
              disabled
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn('github')}
              disabled
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn('apple')}
              disabled
            >
              <Apple className="w-4 h-4 mr-2" />
              Apple
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn('azure')}
              disabled
            >
              <Monitor className="w-4 h-4 mr-2" />
              Microsoft
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            OAuth providers tạm thời chưa khả dụng. Vui lòng sử dụng email/password.
          </p>

          <div className="flex justify-center mt-4">
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}