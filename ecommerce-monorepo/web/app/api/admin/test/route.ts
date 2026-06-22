import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Admin API is working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}