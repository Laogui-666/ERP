import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'
import { createSuccessResponse } from '@/types/api'

// POST /api/auth/logout - 登出，清除 Cookie
export async function POST(_request: NextRequest) {
  await clearAuthCookies()
  return NextResponse.json(createSuccessResponse({ message: '已登出' }))
}
