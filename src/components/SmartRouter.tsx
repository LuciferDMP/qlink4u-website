import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import RedirectPage from '@/pages/RedirectPage'
import NotFound from '@/pages/NotFound'

export default function SmartRouter() {
  const location = useLocation()
  const [isValidAlias, setIsValidAlias] = useState<boolean | null>(null)
  
  // Extract alias from pathname (remove leading slash)
  const alias = location.pathname.substring(1)
  
  useEffect(() => {
    // Skip check for empty alias or known system routes
    if (!alias || alias.includes('/') || alias.startsWith('_') || alias.startsWith('.')) {
      setIsValidAlias(false)
      return
    }
    
    // Check if alias exists in database
    checkAlias()
  }, [alias])
  
  const checkAlias = async () => {
    try {
      const { data, error } = await supabase
        .from('links_2025_10_23_12_04')
        .select('id')
        .eq('alias', alias)
        .eq('is_active', true)
        .single()
      
      setIsValidAlias(!!data && !error)
    } catch (error) {
      setIsValidAlias(false)
    }
  }
  
  // Show loading while checking
  if (isValidAlias === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra link...</p>
        </div>
      </div>
    )
  }
  
  // If valid alias, show redirect page, otherwise show 404
  return isValidAlias ? <RedirectPage /> : <NotFound />
}