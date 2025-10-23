import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUpWithEmail: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Set up auth state listener - NO automatic profile creation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===')
        console.log('Event:', event)
        console.log('Session:', session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Only show success toast for actual sign in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in successfully:', session.user.id)
          
          toast({
            title: "Đăng nhập thành công",
            description: "Chào mừng bạn đến với QLink4u!",
          })
          
          // NO automatic profile creation - keeping it simple
          console.log('No automatic profile creation - keeping it simple')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [toast])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('=== SIGNIN ATTEMPT ===')
      console.log('Email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('=== SIGNIN RESULT ===')
      console.log('Data:', data)
      console.log('Error:', error)
      
      if (error) {
        console.error('Signin error details:', error)
        throw error
      }

      console.log('✅ Signin successful!')
      
      return { data, error: null }
    } catch (error: any) {
      console.error('=== SIGNIN ERROR ===', error)
      toast({
        title: "Lỗi đăng nhập",
        description: error.message || "Không thể đăng nhập. Vui lòng thử lại.",
        variant: "destructive",
      })
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, userData?: any) => {
    try {
      console.log('=== SIGNUP ATTEMPT ===')
      console.log('Email:', email)
      console.log('UserData:', userData)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      })
      
      console.log('=== SIGNUP RESULT ===')
      console.log('Data:', data)
      console.log('Error:', error)
      
      if (error) {
        console.error('Signup error details:', error)
        throw error
      }

      console.log('✅ Signup successful! Check email for confirmation.')

      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác nhận tài khoản. Không cần tạo profile ngay.",
      })
      
      return { data, error: null }
    } catch (error: any) {
      console.error('=== SIGNUP ERROR ===', error)
      toast({
        title: "Lỗi đăng ký",
        description: error.message || "Không thể đăng ký. Vui lòng thử lại.",
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('=== SIGNOUT ATTEMPT ===')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Signout error:', error)
        throw error
      }

      console.log('✅ Signout successful!')
      
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      })
    } catch (error: any) {
      console.error('=== SIGNOUT ERROR ===', error)
      toast({
        title: "Lỗi đăng xuất",
        description: error.message || "Không thể đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      })
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}