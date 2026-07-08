// lib/auth.server.ts - Node runtime only utilities
import jwt from 'jsonwebtoken'; // Node runtime
import bcrypt from 'bcryptjs'; // Node runtime
import { NextResponse } from 'next/server';
import { prisma } from './db';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'auth_token';

// Password hashing (Node only)
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT generation / verification (Node only)
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Cookie helpers (Node runtime – used in API routes)
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}

// User retrieval helpers (Node runtime)
export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;
  return await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      country: true,
      isActive: true,
      isVerified: true,
      supplierId: true,
      supplierProfile: {
        select: { id: true, companyName: true, businessType: true },
      },
    },
  });
}

export function getTokenFromRequest(req: Request | NextResponse): string | null {
  // Try cookie first
  if ('cookies' in req) {
    const cookieToken = (req as any).cookies.get(COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;
  }
  // Header fallback
  const authHeader = (req as any).headers?.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export async function getAuthUser(req: Request | NextResponse) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return await getUserFromToken(token);
}

export async function requireAuth(req: Request | NextResponse) {
  const user = await getAuthUser(req);
  if (!user) throw new Error('Unauthorized');
  if (!user.isActive) throw new Error('Account is disabled');
  return user;
}

export async function requireRole(req: Request | NextResponse, allowedRoles: string[]) {
  const user = await requireAuth(req);
  if (!allowedRoles.includes(user.role)) throw new Error('Forbidden');
  return user;
}

export function createAuthErrorResponse(error: Error) {
  if (error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (error.message === 'Forbidden' || error.message === 'Account is disabled') {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
