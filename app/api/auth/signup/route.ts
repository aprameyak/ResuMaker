import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'
import { auth, AuthError } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await auth.hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    // Generate JWT token
    const token = auth.generateToken({
      userId: user.id,
      email: user.email
    })

    // Create session
    await auth.createSession(user.id, token)

    // Track user action
    await prisma.userAction.create({
      data: {
        userId: user.id,
        action: 'auth_signup',
        metadata: { email: user.email }
      }
    })

    return NextResponse.json({
      user,
      token
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
