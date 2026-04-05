import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@shared/lib/auth'
import { createSuccessResponse, AppError } from '@shared/types/api'

// POST /api/auth/logout - 登出，清除 Cookie
export async function POST(_request: NextRequest) {
  try {
    await clearAuthCookies()
    return NextResponse.json(createSuccessResponse({ message: '已登出' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '登出失败' } },
      { status: 500 }
    )
  }
}
