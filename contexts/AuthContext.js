'use client'

import { createContext, useContext } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const user = session?.user || null

  const signInWithCredentials = async (email, password) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })
    
    if (result?.error) {
      throw new Error(result.error)
    }
    
    return result
  }

  const signInWithGoogle = async () => {
    const result = await signIn('google', { redirect: false })
    
    if (result?.error) {
      throw new Error(result.error)
    }
    
    return result
  }

  const signOutUser = async () => {
    await signOut({ redirect: false })
  }

  const value = {
    user,
    loading,
    signIn: signInWithCredentials,
    signInWithGoogle,
    signOut: signOutUser,
    // Legacy compatibility
    signUp: signInWithCredentials, // For now, map signUp to signIn
    resetPassword: () => Promise.resolve() // Placeholder
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 