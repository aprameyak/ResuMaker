import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-build-only'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Only throw error at runtime, not build time
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

interface JWTPayloadData {
  userId: string
  email: string
}

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'AuthError'
  }
}

export const auth = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  },

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  },

  // Generate JWT token
  generateToken(payload: JWTPayloadData): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
  },

  // Verify JWT token
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as JWTPayload
    } catch (error) {
      throw new AuthError('Invalid or expired token', 401)
    }
  },

  // Create user session
  async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    })
  },

  // Remove user session
  async removeSession(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token }
    })
  },

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}

// Middleware to extract user from request
export const getUserFromToken = async (token: string) => {
  try {
    const payload = auth.verifyToken(token)
    
    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!session) {
      throw new AuthError('Session expired', 401)
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    if (!user) {
      throw new AuthError('User not found', 404)
    }

    return user
  } catch (error) {
    throw new AuthError('Authentication failed', 401)
  }
}
