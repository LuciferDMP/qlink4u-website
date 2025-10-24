import { useTranslation } from 'react-i18next'

interface LoadingProps {
  message?: string
}

export default function Loading({ message }: LoadingProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/images/QLink4U.png" 
            alt="QLink4u Logo" 
            className="h-20 w-auto mx-auto animate-pulse"
          />
        </div>
        
        {/* Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        
        {/* Loading Text */}
        <p className="text-lg text-muted-foreground">
          {message || t('common.loading')}
        </p>
        
        {/* Brand */}
        <p className="text-sm text-muted-foreground mt-2 opacity-75">
          QLink4u.com
        </p>
      </div>
    </div>
  )
}