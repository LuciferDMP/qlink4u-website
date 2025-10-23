import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithOAuth: (provider: 'google' | 'github' | 'apple' | 'azure') => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, userData?: any) => Promise<void>
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session?.user) {
          // Create user profile in background - don't block UI
          createUserProfile(session.user).catch(err => 
            console.error('Background user profile creation failed:', err)
          )
          
          toast({
            title: "Đăng nhập thành công",
            description: "Chào mừng bạn đến với QLink4u!",
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [toast])

  // Create user profile using Edge Function
  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating user profile for:', user.id)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User profile creation timeout')), 5000)
      )
      
      const createPromise = supabase.functions.invoke('ensure_user_profile_2025_10_23_15_12', {
        body: {
          action: 'ensure_user_profile',
          userId: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name
        }
      })

      const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error creating user profile via Edge Function:', error)
      } else {
        console.log('User profile created successfully:', data)
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      // Don't throw - let it fail silently in background
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github' | 'apple' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Lỗi đăng nhập",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in result:', { data, error })
      
      if (error) throw error
      
      console.log('Sign in successful!')
      // Don't do anything else - let the auth state listener handle it
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: "Lỗi đăng nhập",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      })
      if (error) throw error

      // Create user profile immediately if user is created
      if (data.user && !data.user.email_confirmed_at) {
        await createUserProfile(data.user)
      }

      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác nhận tài khoản",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi đăng ký",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi đăng xuất",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithOAuth,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}