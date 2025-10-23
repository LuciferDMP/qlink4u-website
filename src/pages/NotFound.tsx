import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 text-6xl">🔍</div>
          <CardTitle className="text-2xl">Trang không tìm thấy</CardTitle>
          <CardDescription>
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Hoặc thử các trang sau:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <Link to="/dashboard" className="text-primary hover:underline">
                Dashboard
              </Link>
              <span>•</span>
              <Link to="/settings" className="text-primary hover:underline">
                Cài đặt
              </Link>
              <span>•</span>
              <Link to="/profile" className="text-primary hover:underline">
                Hồ sơ
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}