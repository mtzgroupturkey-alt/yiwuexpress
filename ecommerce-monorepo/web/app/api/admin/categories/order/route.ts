export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server'
import { handleOrderUpdate } from '../_helpers/handleOrderUpdate'

export async function POST(req: NextRequest) {
  return handleOrderUpdate(req)
}

export async function PUT(req: NextRequest) {
  return handleOrderUpdate(req)
}
