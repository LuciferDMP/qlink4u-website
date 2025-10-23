import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { 
  ArrowLeft,
  BarChart3, 
  MousePointer, 
  Globe, 
  Smartphone, 
  Monitor,
  Calendar,
  ExternalLink,
  Copy
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

interface LinkData {
  id: string
  alias: string
  destination_url: string
  title?: string
  current_clicks: number
  created_at: string
}

interface ClickData {
  id: string
  clicked_at: string
  country?: string
  city?: string
  device_type?: string
  browser?: string
  os?: string
  referrer?: string
}

interface ChartData {
  date: string
  clicks: number
}

interface StatsData {
  countries: { [key: string]: number }
  cities: { [key: string]: number }
  devices: { [key: string]: number }
  browsers: { [key: string]: number }
  os: { [key: string]: number }
  referrers: { [key: string]: number }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function Analytics() {
  const { linkId } = useParams()
  const [linkData, setLinkData] = useState<LinkData | null>(null)
  const [clicks, setClicks] = useState<ClickData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [stats, setStats] = useState<StatsData>({
    countries: {},
    cities: {},
    devices: {},
    browsers: {},
    os: {},
    referrers: {}
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    if (linkId) {
      fetchLinkData()
      fetchAnalytics()
    }
  }, [linkId, user, timeRange])

  const fetchLinkData = async () => {
    try {
      const { data, error } = await supabase
        .from('links_2025_10_23_12_04')
        .select('*')
        .eq('id', linkId)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setLinkData(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin link",
        variant: "destructive",
      })
      navigate('/dashboard')
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
      }

      const { data, error } = await supabase
        .from('clicks_2025_10_23_12_04')
        .select('*')
        .eq('link_id', linkId)
        .gte('clicked_at', startDate.toISOString())
        .lte('clicked_at', endDate.toISOString())
        .order('clicked_at', { ascending: true })

      if (error) throw error
      
      setClicks(data || [])
      processAnalyticsData(data || [])
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu thống kê",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (clicksData: ClickData[]) => {
    // Process chart data (clicks over time)
    const dateMap: { [key: string]: number } = {}
    
    clicksData.forEach(click => {
      const date = new Date(click.clicked_at).toLocaleDateString('vi-VN')
      dateMap[date] = (dateMap[date] || 0) + 1
    })

    const chartData = Object.entries(dateMap).map(([date, clicks]) => ({
      date,
      clicks
    }))
    
    setChartData(chartData)

    // Process stats data
    const newStats: StatsData = {
      countries: {},
      cities: {},
      devices: {},
      browsers: {},
      os: {},
      referrers: {}
    }

    clicksData.forEach(click => {
      // Countries
      if (click.country) {
        newStats.countries[click.country] = (newStats.countries[click.country] || 0) + 1
      }
      
      // Cities
      if (click.city) {
        newStats.cities[click.city] = (newStats.cities[click.city] || 0) + 1
      }
      
      // Devices
      if (click.device_type) {
        newStats.devices[click.device_type] = (newStats.devices[click.device_type] || 0) + 1
      }
      
      // Browsers
      if (click.browser) {
        newStats.browsers[click.browser] = (newStats.browsers[click.browser] || 0) + 1
      }
      
      // OS
      if (click.os) {
        newStats.os[click.os] = (newStats.os[click.os] || 0) + 1
      }
      
      // Referrers
      if (click.referrer && click.referrer !== '') {
        try {
          const domain = new URL(click.referrer).hostname
          newStats.referrers[domain] = (newStats.referrers[domain] || 0) + 1
        } catch {
          newStats.referrers['Direct'] = (newStats.referrers['Direct'] || 0) + 1
        }
      } else {
        newStats.referrers['Direct'] = (newStats.referrers['Direct'] || 0) + 1
      }
    })

    setStats(newStats)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép!",
      description: "Link đã được sao chép vào clipboard",
    })
  }

  const formatStatsForChart = (data: { [key: string]: number }) => {
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải thống kê...</p>
        </div>
      </div>
    )
  }

  if (!linkData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy link</h2>
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
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
              <h1 className="text-xl font-bold">Thống kê Link</h1>
              <p className="text-sm text-muted-foreground">
                {linkData.title || `qlink4u.com/r/${linkData.alias}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(`https://qlink4u.com/${linkData.alias}`)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Sao chép link
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://qlink4u.com/${linkData.alias}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở link
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Link Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Thông tin link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Link rút gọn</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  qlink4u.com/{linkData.alias}
                </code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">URL đích</p>
                <p className="text-sm truncate" title={linkData.destination_url}>
                  {linkData.destination_url}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng clicks</p>
                <p className="text-2xl font-bold text-primary">{linkData.current_clicks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="text-sm">{new Date(linkData.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-sm font-medium">Khoảng thời gian:</span>
          {['24h', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 giờ' : 
               range === '7d' ? '7 ngày' :
               range === '30d' ? '30 ngày' : '90 ngày'}
            </Button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Clicks Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Lượt click theo thời gian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="clicks" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Loại thiết bị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatStatsForChart(stats.devices)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatStatsForChart(stats.devices).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Tabs defaultValue="referrers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="referrers">Nguồn truy cập</TabsTrigger>
            <TabsTrigger value="locations">Vị trí</TabsTrigger>
            <TabsTrigger value="browsers">Trình duyệt</TabsTrigger>
            <TabsTrigger value="os">Hệ điều hành</TabsTrigger>
          </TabsList>

          <TabsContent value="referrers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Nguồn truy cập
                </CardTitle>
                <CardDescription>
                  Top các trang web giới thiệu traffic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={formatStatsForChart(stats.referrers)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quốc gia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.countries)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([country, count]) => (
                        <div key={country} className="flex justify-between items-center">
                          <span className="text-sm">{country || 'Không xác định'}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thành phố</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.cities)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([city, count]) => (
                        <div key={city} className="flex justify-between items-center">
                          <span className="text-sm">{city || 'Không xác định'}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browsers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Trình duyệt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={formatStatsForChart(stats.browsers)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="os">
            <Card>
              <CardHeader>
                <CardTitle>Hệ điều hành</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={formatStatsForChart(stats.os)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatStatsForChart(stats.os).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}