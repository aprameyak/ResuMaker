'use client'

import { useState, useEffect, Suspense, FormEvent, ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const { signIn, signUp, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }
        
        await signUp(email, password, { full_name: fullName })
        setMessage('Check your email for the confirmation link!')
      } else {
        await signIn(email, password)
        router.push(redirectTo)
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if user is already authenticated
  if (user) {
    return null
  }

  const field = (id: string, label: string, props: Record<string, unknown>, hint?: string) => (
    <div>
      <label htmlFor={id} className="label">
        {label}{hint && <span className="muted" style={{ fontWeight: 400 }}> {hint}</span>}
      </label>
      <input id={id} className="input" {...props} />
    </div>
  )

  return (
    <div className="container" style={{ maxWidth: '440px', paddingTop: '56px', paddingBottom: '72px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
        {isSignUp ? 'Create your account' : 'Sign in to your account'}
      </h1>
      <p className="secondary" style={{ marginBottom: '24px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError('')
            setMessage('')
          }}
          className="link"
          style={{ fontWeight: 600 }}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>

      <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isSignUp && field('fullName', 'Full name', {
          type: 'text',
          required: true,
          value: fullName,
          autoComplete: 'name',
          onChange: (e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value),
        })}

        {field('email', 'Email address', {
          type: 'email',
          required: true,
          value: email,
          autoComplete: 'email',
          onChange: (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        })}

        {field('password', 'Password', {
          type: 'password',
          required: true,
          minLength: 6,
          value: password,
          autoComplete: isSignUp ? 'new-password' : 'current-password',
          onChange: (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        }, isSignUp ? '(at least 6 characters)' : undefined)}

        {isSignUp && field('confirmPassword', 'Confirm password', {
          type: 'password',
          required: true,
          minLength: 6,
          value: confirmPassword,
          autoComplete: 'new-password',
          onChange: (e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
        })}

        {error && (
          <div className="notice notice-error" role="alert">{error}</div>
        )}

        {message && (
          <div className="notice notice-success" role="status">{message}</div>
        )}

        <button type="submit" disabled={loading} className="btn" style={{ width: '100%' }}>
          {loading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Sign in')}
        </button>
      </form>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: '56px' }}><p className="muted">Loading...</p></div>}>
      <AuthForm />
    </Suspense>
  )
}
