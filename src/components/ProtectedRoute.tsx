import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Lock, LogIn, UserPlus } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  // Show login required if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Yêu cầu đăng nhập</CardTitle>
            <CardDescription>
              Bạn cần đăng nhập để truy cập trang này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate('/')}>
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Đăng ký
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Hoặc quay về <button 
                onClick={() => navigate('/')} 
                className="text-primary hover:underline font-medium"
              >
                trang chủ
              </button> để tạo link ẩn danh</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}