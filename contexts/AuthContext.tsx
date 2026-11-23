'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { trackUserAction } from '../lib/userTracking'

interface User {
  id: string
  email: string
  name?: string | null
  createdAt: string
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'

function readToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
function writeToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* storage blocked or full */ }
}
function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* storage blocked */ }
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const token = readToken()
        if (token) {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const { user } = await response.json()
            setUser(user)
          } else {
            clearToken()
          }
        }
      } catch {
        clearToken()
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        name: metadata.name
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed')
    }

    writeToken(data.token)
    setUser(data.user)

    // Track user action
    if (data.user?.id) {
      await trackUserAction(data.user.id, 'auth_signup')
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Signin failed')
    }

    writeToken(data.token)
    setUser(data.user)

    // Track user action
    if (data.user?.id) {
      await trackUserAction(data.user.id, 'auth_signin')
    }

    return data
  }

  const signOut = async () => {
    try {
      const token = readToken()
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Error during signout:', error)
    } finally {
      clearToken()
      setUser(null)
    }
  }

  const resetPassword = async (email: string) => {
    // TODO: Implement password reset functionality
    throw new Error('Password reset not yet implemented')
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
