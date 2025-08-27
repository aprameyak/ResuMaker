import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token and get user
    const user = await getUserFromToken(token)

    return NextResponse.json({
      user
    })

  } catch (error) {
    console.error('Token verification error:', error)
    
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
