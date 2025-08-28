import { NextRequest, NextResponse } from 'next/server'
import { auth, getUserFromToken } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
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

    // Remove session
    await auth.removeSession(token)

    // Track user action
    // Note: We'll need to import prisma here if we want to track the action
    // For now, we'll just remove the session

    return NextResponse.json({
      message: 'Successfully signed out'
    })

  } catch (error) {
    console.error('Signout error:', error)
    
    // Even if there's an error, we should still return success
    // to ensure the client-side logout works
    return NextResponse.json({
      message: 'Successfully signed out'
    })
  }
}
