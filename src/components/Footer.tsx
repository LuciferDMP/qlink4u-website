import { useEffect, useState } from 'react'

interface VersionInfo {
  version: string
  buildDate: string
  environment: string
  features: string[]
}

export default function Footer() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(err => console.error('Failed to load version info:', err))
  }, [])

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Company info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <img src="/images/QLink4U.png" alt="QLink4u Logo" className="h-6 w-auto" />
              <span className="font-bold text-gray-800">QLink4u.com</span>
            </div>
            <p className="text-sm text-gray-600">
              Dịch vụ rút gọn link chuyên nghiệp
            </p>
            <p className="text-xs text-gray-500">
              © 2025 QLink4u.com. All rights reserved.
            </p>
          </div>

          {/* Center - Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">
              Hỗ trợ
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition-colors">
              API Documentation
            </a>
          </div>

          {/* Right side - Version info */}
          <div className="text-center md:text-right">
            {versionInfo && (
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-end space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    versionInfo.environment === 'beta' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {versionInfo.environment === 'beta' ? '🧪 BETA' : '🚀 PRODUCTION'}
                  </span>
                  <span className="text-sm font-mono text-gray-700">
                    {versionInfo.version}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Build: {new Date(versionInfo.buildDate).toLocaleString('vi-VN')}
                </p>
                {versionInfo.environment === 'beta' && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Phiên bản thử nghiệm - Có thể có lỗi
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Beta features showcase */}
        {versionInfo?.environment === 'beta' && versionInfo.features && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-primary">
                🆕 Tính năng mới trong phiên bản này
              </summary>
              <div className="mt-2 pl-4">
                <ul className="text-xs text-gray-600 space-y-1">
                  {versionInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        )}
      </div>
    </footer>
  )
}