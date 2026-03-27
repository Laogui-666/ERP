import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/types/user'

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production')
    }
    console.warn('[SECURITY] Using default JWT_SECRET — NOT SECURE. Set JWT_SECRET in .env.local')
    return 'default-access-secret-dev-only'
  })(),
)

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET environment variable is required in production')
    }
    console.warn('[SECURITY] Using default JWT_REFRESH_SECRET — NOT SECURE. Set JWT_REFRESH_SECRET in .env.local')
    return 'default-refresh-secret-dev-only'
  })(),
)

const ACCESS_TOKEN_EXPIRES = '15m'
const REFRESH_TOKEN_EXPIRES = '7d'

export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  companyId: string
  departmentId: string | null
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(ACCESS_TOKEN_SECRET)
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(REFRESH_TOKEN_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET)
  return payload as unknown as JwtPayload
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET)
  return payload as unknown as JwtPayload
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  })
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('access_token')?.value
  if (cookieToken) return cookieToken

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

export async function getCurrentUser(request: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null

  try {
    return await verifyAccessToken(token)
  } catch {
    return null
  }
}
