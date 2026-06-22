import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export function withAuth(handler: Function) {
  return async function (req: NextRequest, ...args: any[]) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user info to request
    const requestWithUser = req.clone()
    Object.assign(requestWithUser, { user: payload })

    return handler(requestWithUser, ...args)
  }
}